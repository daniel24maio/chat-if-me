import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import pg from "pg";

/**
 * Servidor MCP — Chat Assistente Virtual IFMG Knowledge Server
 *
 * Expõe o banco de dados PostgreSQL (pgvector) como uma ferramenta MCP
 * que pode ser invocada por qualquer cliente MCP (ex: o agente no Express).
 *
 * Ferramenta exposta:
 * search_ifmg_knowledge — busca híbrida nos documentos do IFMG
 *
 * Transporte: stdio (o servidor roda como subprocesso)
 *
 * IMPORTANTE: NÃO usar console.log() — stdout é reservado pelo protocolo MCP.
 * Usar console.error() para debug (vai para stderr).
 */

// ---------------------------------------------------------------------------
// Configuração (lê variáveis de ambiente do processo pai)
// ---------------------------------------------------------------------------

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://chatifme:chatifme123@localhost:5432/chatifme";

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";

const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "bge-m3";

/** Parâmetros do Reciprocal Rank Fusion (RRF) */
const RRF_K = 60;
const RRF_ALPHA = 0.4;

/** Nota de corte (Threshold). Documentos abaixo deste score são ignorados (Lixo Semântico) */
const MIN_RRF_SCORE = 0.002;

/** Número máximo de trechos a retornar ao agente */
const MAX_RESULTS = 5;

/** Janela de candidatos recuperados do banco antes do re-ranking em memória */
const CANDIDATE_POOL_LIMIT = 50;

/** Fator de sensibilidade à penalização por feedback negativo (ICL Dinâmico) */
const PENALTY_BETA = 0.08;

// ---------------------------------------------------------------------------
// PostgreSQL
// ---------------------------------------------------------------------------

const { Pool } = pg;
const pool = new Pool({ connectionString: DATABASE_URL });

// ---------------------------------------------------------------------------
// Funções auxiliares
// ---------------------------------------------------------------------------

/**
 * Gera embedding de um texto via Ollama (bge-m3).
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBED_MODEL,
      prompt: text,
      keep_alive: "24h",
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding error: ${response.status}`);
  }

  const data = (await response.json()) as { embedding: number[] };
  return data.embedding;
}

interface RetrievedChunk {
  id: number;
  content: string;
  source: string;
  similarity: number;
  pages?: string;
  sectionContext?: string;
  sourceUrl?: string;
}

/**
 * Extrai metadados complementares (página, seção e URL) do chunk caso não estejam
 * preenchidos diretamente nas colunas JSONB de metadata (compatibilidade retroativa).
 */
function enrichChunkMetadata(row: {
  id: number;
  content: string;
  source?: string;
  rrf_score: number;
  pages?: string;
  section_context?: string;
  source_url?: string;
}): RetrievedChunk {
  const content = row.content || "";
  const headerMatch = content.match(/^\[([^\]]+)\]/);
  const headerText = headerMatch ? headerMatch[1] : "";

  let pages = row.pages || undefined;
  if (!pages) {
    const pageInHeader = headerText.match(/P[aá]ginas?:\s*([\d\-,\s]+)/i);
    const pageInBody = content.match(/\b(?:P[aá]g(?:ina)?\.?\s*|p\.\s*)(\d{1,4})\b/i);
    if (pageInHeader) pages = pageInHeader[1].trim();
    else if (pageInBody) pages = pageInBody[1].trim();
  }

  let sectionContext = row.section_context || undefined;
  if (!sectionContext && headerText) {
    const ctxMatch = headerText.match(/Contexto:\s*([^|\]]+)/i);
    if (ctxMatch) sectionContext = ctxMatch[1].trim();
  }

  let sourceUrl = row.source_url || undefined;
  if (!sourceUrl) {
    const linkInHeader = headerText.match(/Link:\s*(https?:\/\/[^\s|\]]+)/i);
    const linkInBody = content.match(/https?:\/\/[^\s)\]>,"']+/i);
    if (linkInHeader) sourceUrl = linkInHeader[1].trim();
    else if (linkInBody) sourceUrl = linkInBody[0].replace(/[.;,:!?]+$/, "");
  }

  return {
    id: Number(row.id),
    content,
    source: row.source || "documento desconhecido",
    similarity: Number(row.rrf_score),
    ...(pages ? { pages } : {}),
    ...(sectionContext ? { sectionContext } : {}),
    ...(sourceUrl ? { sourceUrl } : {}),
  };
}

/**
 * Formata a identificação completa da fonte (Documento + Página/Seção + Link)
 * para exibição no cabeçalho do trecho e na lista de fontes do frontend.
 */
function formatSourceDisplay(doc: RetrievedChunk): string {
  const details: string[] = [];
  if (doc.pages) {
    details.push(`pág. ${doc.pages}`);
  }
  if (doc.sectionContext) {
    details.push(doc.sectionContext);
  }
  let label = details.length > 0 ? `${doc.source} (${details.join(" — ")})` : doc.source;
  if (doc.sourceUrl) {
    label += ` | ${doc.sourceUrl}`;
  }
  return label;
}

/**
 * Detecta o número do período (1 a 10) mencionado na consulta, se houver.
 */
function detectTargetPeriod(text: string): number | null {
  const t = text.toLowerCase();
  const numMatch =
    t.match(/\b(\d{1,2})\s*[oºª]?\s*(?:per[íi]odo|semestre)\b/i) ||
    t.match(/\b(?:per[íi]odo|semestre)\s*(\d{1,2})\b/i);
  if (numMatch) {
    const n = Number(numMatch[1]);
    if (n >= 1 && n <= 10) return n;
  }

  const wordMap: Array<[RegExp, number]> = [
    [/\bprimeiro\s+(?:per[íi]odo|semestre)\b/i, 1],
    [/\bsegundo\s+(?:per[íi]odo|semestre)\b/i, 2],
    [/\bterceiro\s+(?:per[íi]odo|semestre)\b/i, 3],
    [/\bquarto\s+(?:per[íi]odo|semestre)\b/i, 4],
    [/\bquinto\s+(?:per[íi]odo|semestre)\b/i, 5],
    [/\bsexto\s+(?:per[íi]odo|semestre)\b/i, 6],
    [/\bs[eé]timo\s+(?:per[íi]odo|semestre)\b/i, 7],
    [/\boitavo\s+(?:per[íi]odo|semestre)\b/i, 8],
    [/\bnono\s+(?:per[íi]odo|semestre)\b/i, 9],
    [/\bd[eé]cimo\s+(?:per[íi]odo|semestre)\b/i, 10],
  ];
  for (const [rx, num] of wordMap) {
    if (rx.test(t)) return num;
  }
  return null;
}

interface CourseProfile {
  id: string;
  queryRegex: RegExp;
  docMatchRegex: RegExp;
  ftsClause: string;
}

const COURSE_PROFILES: CourseProfile[] = [
  {
    id: "BSI",
    queryRegex: /\b(?:sistemas?\s+de\s+informa[cç][aã]o|bsi|ppcbsi|obbgsin)\b/i,
    docMatchRegex: /\b(?:ppcbsi|obbgsin|sistemas?\s+de\s+informa[cç][aã]o)\b/i,
    ftsClause: "(obbgsin:* | ppcbsi:* | (sistemas & informacao))",
  },
  {
    id: "ADM",
    queryRegex: /\b(?:administra[cç][aã]o|obbgadm|ppcadm)\b/i,
    docMatchRegex: /\b(?:ppcadm|obbgadm|bacharelado\s+em\s+administra[cç][aã]o|curso\s+de\s+administra[cç][aã]o)\b/i,
    ftsClause: "(obbgadm:* | ppcadm:* | administracao)",
  },
  {
    id: "EMT",
    queryRegex: /\b(?:engenharia\s+metal[uú]rgica|metal[uú]rgica|metalurgia|obbgemt|ppcemt)\b/i,
    docMatchRegex: /\b(?:ppcemt|obbgemt|engenharia\s+metal[uú]rgica)\b/i,
    ftsClause: "(obbgemt:* | ppcemt:* | metalurgica)",
  },
  {
    id: "PED",
    queryRegex: /\b(?:pedagogia|oblped|ppcped)\b/i,
    docMatchRegex: /\b(?:ppcped|oblped|licenciatura\s+em\s+pedagogia|curso\s+de\s+pedagogia)\b/i,
    ftsClause: "(oblped:* | ppcped:* | pedagogia)",
  },
  {
    id: "COMP",
    queryRegex: /\b(?:licenciatura\s+em\s+computa[cç][aã]o|computa[cç][aã]o|oblcomp|ppccomp)\b/i,
    docMatchRegex: /\b(?:ppccomp|oblcomp|licenciatura\s+em\s+computa[cç][aã]o)\b/i,
    ftsClause: "(oblcomp:* | ppccomp:* | computacao)",
  },
];

/**
 * Formata a query para o formato tsquery do PostgreSQL (FTS).
 * Remove caracteres especiais, expande numerais ordinais e adiciona palavras de apoio da intenção (intent).
 */
function formatFTSQuery(query: string, intent?: string, fullContextText?: string): string {
  const detectionText = fullContextText ? `${query} ${fullContextText}` : query;
  const stopWords = new Set([
    "qual", "quais", "como", "onde", "quando", "para", "sobre", "entre", "este", "esta",
    "esses", "essas", "pode", "podia", "poderia", "favor", "voce", "sao", "tem", "ter",
    "conteudo", "conteúdo", "disciplina", "disciplinas", "disiciplina", "disiciplinas",
    "materia", "materias", "matéria", "matérias", "grade", "detalhes", "programa",
    "curso", "cursos", "bacharelado", "licenciatura", "tecnologo", "tecnólogo",
    "ifmg", "campus", "ouro", "branco", "de", "da", "do", "das", "dos", "em", "na", "no",
    "nas", "nos", "por", "com", "sem", "ao", "aos", "as", "os", "um", "uma"
  ]);

  const ordinalMap: Record<string, string> = {
    primeiro: "(primeiro | 1 | 1º)",
    "1º": "(primeiro | 1 | 1º)",
    "1": "(primeiro | 1 | 1º)",
    segundo: "(segundo | 2 | 2º)",
    "2º": "(segundo | 2 | 2º)",
    "2": "(segundo | 2 | 2º)",
    terceiro: "(terceiro | 3 | 3º)",
    "3º": "(terceiro | 3 | 3º)",
    "3": "(terceiro | 3 | 3º)",
    quarto: "(quarto | 4 | 4º)",
    "4º": "(quarto | 4 | 4º)",
    "4": "(quarto | 4 | 4º)",
    quinto: "(quinto | 5 | 5º)",
    "5º": "(quinto | 5 | 5º)",
    "5": "(quinto | 5 | 5º)",
    sexto: "(sexto | 6 | 6º)",
    "6º": "(sexto | 6 | 6º)",
    "6": "(sexto | 6 | 6º)",
    setimo: "(setimo | 7 | 7º)",
    sétimo: "(setimo | 7 | 7º)",
    "7º": "(setimo | 7 | 7º)",
    "7": "(setimo | 7 | 7º)",
    oitavo: "(oitavo | 8 | 8º)",
    "8º": "(oitavo | 8 | 8º)",
    "8": "(oitavo | 8 | 8º)",
    nono: "(nono | 9 | 9º)",
    "9º": "(nono | 9 | 9º)",
    "9": "(nono | 9 | 9º)",
    decimo: "(decimo | décimo | 10 | 10º)",
    décimo: "(decimo | décimo | 10 | 10º)",
    "10º": "(decimo | décimo | 10 | 10º)",
    "10": "(decimo | décimo | 10 | 10º)",
  };

  const codeMatch = detectionText.match(/(OBBGSIN|OBBGADM|OBBGEMT|OBLCOMP|OBLPED)\.?(\d{3})/i);
  let codeFTS = "";
  if (codeMatch) {
    codeFTS = `(${codeMatch[1].toLowerCase()}:* & (${codeMatch[2]} | ${codeMatch[1].toLowerCase()}.${codeMatch[2]}))`;
  }

  const queryLimpa = query.replace(/[^\p{L}\p{N}\s]/gu, " ").toLowerCase().trim();
  if (!queryLimpa) return codeFTS || "dummy_fallback_query";

  const rawTerms = queryLimpa.split(/\s+/).filter((w) => w.length >= 1 && (w.length >= 2 || /^\d$/.test(w)) && !stopWords.has(w));
  const terms = rawTerms.map((w) => {
    if (ordinalMap[w]) return ordinalMap[w];
    if (/^(?:obbg|obl|ppc)[a-z0-9]+$/i.test(w)) return `${w}:*`;
    return w;
  });
  let mainFTS = terms.length > 0 ? terms.join(" & ") : "";

  // Cláusula focada de período + curso e cláusula tabular para matrizes curriculares (ex: "7 OBBGSIN.040")
  const targetPeriod = detectTargetPeriod(detectionText);
  const targetCourse = COURSE_PROFILES.find((c) => c.queryRegex.test(detectionText));
  const periodOrdinalClause = targetPeriod ? ordinalMap[String(targetPeriod)] : null;

  const focusedClauses: string[] = [];
  if (codeFTS) focusedClauses.push(codeFTS);
  if (mainFTS) focusedClauses.push(`(${mainFTS})`);
  if (targetPeriod && targetCourse) {
    focusedClauses.push(`(${targetPeriod} & ${targetCourse.ftsClause} & (semestre | optativa | pre | ch | periodo))`);
    focusedClauses.push(`(${periodOrdinalClause} & periodo & ${targetCourse.ftsClause})`);
  }
  if (targetPeriod) {
    focusedClauses.push(
      `(${targetPeriod} & (obbgsin:* | obbgadm:* | obbgemt:* | oblcomp:* | oblped:* | optativa) & (semestre | periodo | ch))`
    );
  }
  if (periodOrdinalClause) {
    focusedClauses.push(`(${periodOrdinalClause} & periodo)`);
  }
  if (targetCourse) {
    focusedClauses.push(targetCourse.ftsClause);
  }

  mainFTS = focusedClauses.length > 0 ? focusedClauses.join(" | ") : "dummy_fallback_query";

  const intentKeywords: Record<string, string> = {
    ESTRUTURA_CURSOS: "matriz | curricular | periodo",
    DISCIPLINA_EMENTA: "ementa | ementario | conteudo",
    CONTEUDO: "ementa | ementario | conteudo",
    INGRESSO_MATRICULA: "matricula | ingresso",
    AVALIACAO_FREQUENCIA: "frequencia | faltas | nota",
    ESTAGIO_TCC: "tcc | estagio",
    ATIVIDADES_EXTRAS: "complementares | extensao",
    ASSISTENCIA_BOLSAS: "bolsa | auxilio | transporte | mobilidade",
    INFRA_CAMPUS: "biblioteca | laboratorio | restaurante | refeitorio | sala | bloco | localizacao",
    DIREITOS_DEVERES: "direitos | deveres",
  };

  if (intent && (intent === "DISCIPLINA_EMENTA" || intent === "DISCIPLINA" || intent === "CONTEUDO")) {
    mainFTS = `(${mainFTS}) | (ementa | ementario | conteudo | programa)`;
  } else if (intent && intentKeywords[intent]) {
    mainFTS = `(${mainFTS}) | (${intentKeywords[intent]})`;
  }

  return mainFTS;
}

/**
 * Aplica heurísticas de re-ranking sobre os candidatos híbridos:
 *   1. Afinidade por curso (ex: Sistemas de Informação / PPCBSI / OBBGSIN vs. outros PPCs)
 *   2. Detecção de linhas tabulares de período na Matriz Curricular (ex: "7 OBBGSIN.040", "7 Optativa III")
 *   3. Diferenciação entre Tabela da Matriz Curricular vs. Fichas Individuais do Ementário
 *   4. Bonificação de código específico de disciplina e ementa
 */
function applyRerankingBoosts(
  documents: RetrievedChunk[],
  fullSearchText: string,
  intent?: string
): void {
  const isEmentaQuery = intent === "DISCIPLINA_EMENTA" || intent === "DISCIPLINA" || intent === "CONTEUDO";
  const isCursoQuery = intent === "CURSO" || intent === "ESTRUTURA_CURSOS";

  const codeMatch = fullSearchText.match(/(OBBGSIN|OBBGADM|OBBGEMT|OBLCOMP|OBLPED)\.?(\d{3})/i);
  const targetCode = codeMatch ? `${codeMatch[1]}.${codeMatch[2]}`.toLowerCase() : null;

  const targetCourse = COURSE_PROFILES.find((c) => c.queryRegex.test(fullSearchText));
  const otherCourses = targetCourse
    ? COURSE_PROFILES.filter((c) => c.id !== targetCourse.id)
    : [];

  const targetPeriod = detectTargetPeriod(fullSearchText);
  const periodOrdWords: Record<number, string> = {
    1: "primeiro",
    2: "segundo",
    3: "terceiro",
    4: "quarto",
    5: "quinto",
    6: "sexto",
    7: "s[eé]timo",
    8: "oitavo",
    9: "nono",
    10: "d[eé]cimo",
  };
  const targetPeriodRegex = targetPeriod
    ? new RegExp(
        `\\b(?:${targetPeriod}\\s*[oºª]?\\s*per[íi]odo|${periodOrdWords[targetPeriod]}\\s+per[íi]odo|per[íi]odo\\s*[:\\-]?\\s*${targetPeriod}\\b)`,
        "i"
      )
    : null;
  const tabularTargetPeriodRegex = targetPeriod
    ? new RegExp(
        `(?:^|\\n|\\s)${targetPeriod}\\s+(?:(?:OBBG|OBL)[A-Z]{2,6}\\.\\d{3}|Optativa\\s+[IVX\\d]+)\\b`,
        "gi"
      )
    : null;

  for (const doc of documents) {
    const contentLower = doc.content.toLowerCase();
    const docFullText = `${doc.source} ${doc.sectionContext || ""} ${doc.content}`;

    // 1. Afinidade por Curso (evita colisão entre múltiplos PPCs no banco)
    if (targetCourse) {
      if (targetCourse.docMatchRegex.test(docFullText)) {
        doc.similarity += 0.14;
      } else if (otherCourses.some((oc) => oc.docMatchRegex.test(docFullText))) {
        doc.similarity -= 0.15;
      }
    }

    // 2. Código específico de disciplina (ex: OBBGSIN.034)
    if (targetCode && contentLower.includes(targetCode)) {
      doc.similarity += 0.15;

      if (isEmentaQuery && /ementa:/i.test(doc.content)) {
        doc.similarity += 0.30;
      }
    } else if (isEmentaQuery && /ementa:/i.test(doc.content)) {
      doc.similarity += 0.10;
    }

    // 3. Classificação estrutural do chunk: Tabela de Matriz Curricular vs. Ficha Individual de Ementário
    const distinctCodes = new Set(
      (doc.content.match(/\b(?:OBBG|OBL)[A-Z]{2,6}\.\d{3}\b/gi) || []).map((c) => c.toUpperCase())
    );
    const hasCourseCodes = distinctCodes.size > 0;
    const isEmentaCard =
      /\bEmenta:\s/i.test(doc.content) || /\bBibliografia\s+b[aá]sica:/i.test(doc.content);

    const tabularTargetMatches = tabularTargetPeriodRegex
      ? (doc.content.match(tabularTargetPeriodRegex) || []).length
      : 0;
    const hasAnyTabularRows =
      /(?:^|\n|\s)(?:[1-9]|10)\s+(?:(?:OBBG|OBL)[A-Z]{2,6}\.\d{3}|Optativa\s+[IVX\d]+)\b/i.test(doc.content);

    const isMatrixTableChunk =
      !isEmentaCard &&
      (/PER[IÍ]ODO\s+COD\.?\s+DISCIPLINA|Carga\s+Hor[aá]ria\s+Total\s+do\s+Semestre|DISCIPLINAS\s+OBRIGAT[OÓ]RIAS/i.test(
        docFullText
      ) ||
        distinctCodes.size >= 3 ||
        tabularTargetMatches >= 2 ||
        hasAnyTabularRows);

    const matchesExplicitPeriod = Boolean(targetPeriodRegex && targetPeriodRegex.test(docFullText));
    const matchesTargetPeriod = tabularTargetMatches > 0 || matchesExplicitPeriod;

    if (targetPeriod) {
      if (isMatrixTableChunk && matchesTargetPeriod) {
        // Chunk da Tabela da Matriz Curricular que contém as disciplinas do período perguntado (ex: Página 33 do PPCBSI)
        doc.similarity += 0.42;
      } else if (isMatrixTableChunk && !matchesTargetPeriod && hasAnyTabularRows) {
        // Parte da tabela da Matriz Curricular de OUTROS períodos (ex: Páginas 31-32 com períodos 1 a 6)
        doc.similarity -= 0.12;
      } else if (isEmentaCard && matchesTargetPeriod) {
        // Ficha individual de ementa de uma disciplina do período perguntado (entra como complemento após a Matriz)
        doc.similarity += isCursoQuery ? 0.08 : 0.20;
      } else if (matchesTargetPeriod) {
        // Menção textual/narrativa ao período (ex: Página 25 sobre TCC)
        doc.similarity += hasCourseCodes ? 0.15 : 0.02;
      } else if (isCursoQuery && /\b(?:[1-9]|10)\s*[oºª]\s*Per[íi]odo\b/i.test(docFullText)) {
        // Chunk explícito de outro período diferente do perguntado
        doc.similarity -= 0.06;
      }
    } else if (isCursoQuery && isMatrixTableChunk) {
      // Pergunta geral sobre matriz/grade curricular sem período específico
      doc.similarity += 0.25;
    }

    // 4. Boost geral para chunks de Tabela da Matriz Curricular quando a pergunta for sobre estrutura/período
    if (isCursoQuery && isMatrixTableChunk) {
      doc.similarity += 0.12;
    }

    // 5. Penalização para ficha individual de ementa de outros períodos quando se busca estrutura/grade
    if (isCursoQuery && isEmentaCard && !matchesTargetPeriod) {
      doc.similarity -= 0.08;
    }

    // 6. Penalização para tabela de matriz quando se busca ementa específica de uma disciplina
    if (isEmentaQuery && isMatrixTableChunk) {
      doc.similarity -= 0.15;
    }
  }
}

/**
 * Busca híbrida (vetorial + FTS) no pgvector usando Reciprocal Rank Fusion (RRF),
 * Limite de Corte e Penalização por Feedback Negativo.
 */
async function searchDocuments(
  embedding: number[],
  queryText: string,
  limit: number,
  intent?: string
): Promise<RetrievedChunk[]> {
  const vectorStr = `[${embedding.join(",")}]`;
  const ftsQuery = formatFTSQuery(queryText, intent);
  const candidateLimit = Math.max(limit * 6, CANDIDATE_POOL_LIMIT);

  console.error(
    `🔍 [MCP] Busca híbrida (α=${RRF_ALPHA}, k=${RRF_K}) | Intenção: [${intent || "N/A"}] | FTS: "${ftsQuery}"`
  );

  const result = await pool.query(
    `WITH
       semantic AS (
         SELECT id, content AS content,
           metadata->>'filename' AS source,
           metadata->>'pages' AS pages,
           metadata->>'sectionContext' AS section_context,
           metadata->>'sourceUrl' AS source_url,
           1 - (embedding <=> $1::vector) AS similarity,
           ROW_NUMBER() OVER (ORDER BY embedding <=> $1::vector) AS rank
         FROM documents
         ORDER BY embedding <=> $1::vector
         LIMIT 80
       ),
       lexical AS (
         SELECT id, content AS content,
           metadata->>'filename' AS source,
           metadata->>'pages' AS pages,
           metadata->>'sectionContext' AS section_context,
           metadata->>'sourceUrl' AS source_url,
           ts_rank_cd(content_tsv, to_tsquery('portuguese_unaccent', $2::text)) AS ts_score,
           ROW_NUMBER() OVER (
             ORDER BY ts_rank_cd(content_tsv, to_tsquery('portuguese_unaccent', $2::text)) DESC
           ) AS rank
         FROM documents
         WHERE content_tsv @@ to_tsquery('portuguese_unaccent', $2::text)
         ORDER BY ts_score DESC
         LIMIT 80
       ),
       hybrid_results AS (
         SELECT
           COALESCE(s.id, l.id) AS id,
           COALESCE(s.content, l.content) AS content,
           COALESCE(s.source, l.source) AS source,
           COALESCE(s.pages, l.pages) AS pages,
           COALESCE(s.section_context, l.section_context) AS section_context,
           COALESCE(s.source_url, l.source_url) AS source_url,
           COALESCE(s.similarity, 0) AS similarity,
           (
             ${RRF_ALPHA} * COALESCE(1.0 / (${RRF_K} + s.rank), 0.0) +
             ${1 - RRF_ALPHA} * COALESCE(1.0 / (${RRF_K} + l.rank), 0.0)
           ) AS rrf_score
         FROM semantic s
         FULL OUTER JOIN lexical l ON s.id = l.id
       )
     SELECT * FROM hybrid_results
     WHERE rrf_score >= ${MIN_RRF_SCORE}
     ORDER BY rrf_score DESC
     LIMIT $3`,
    [vectorStr, ftsQuery, candidateLimit]
  );

  let documents = result.rows.map((row) => enrichChunkMetadata(row));

  // Re-ranking completo sobre o pool de candidatos antes do corte final
  applyRerankingBoosts(documents, queryText, intent);
  documents.sort((a, b) => b.similarity - a.similarity);

  // ── Penalização por feedback negativo (ICL Dinâmico) ──
  if (documents.length > 0) {
    try {
      const chunkIds = documents.map((d) => d.id);
      const negResult = await pool.query(
        `SELECT unnest(chunk_ids) AS chunk_id, COUNT(*) AS neg_count
          FROM chat_feedbacks
          WHERE feedback_type = 'negative'
            AND chunk_ids && $1::integer[]
          GROUP BY chunk_id`,
        [chunkIds]
      );

      if (negResult.rows.length > 0) {
        const negatives = new Map<number, number>();
        for (const row of negResult.rows) {
          negatives.set(Number(row.chunk_id), Number(row.neg_count));
        }

        for (const doc of documents) {
          const negCount = negatives.get(doc.id) || 0;
          if (negCount > 0) {
            const originalScore = doc.similarity;
            doc.similarity *= 1 / (1 + PENALTY_BETA * negCount);
            console.error(
              `⚠️  [MCP RRF] Chunk #${doc.id} penalizado (β=${PENALTY_BETA}): ` +
              `${negCount} negativo(s), score ${originalScore.toFixed(4)} → ${doc.similarity.toFixed(4)}`
            );
          }
        }

        documents.sort((a, b) => b.similarity - a.similarity);
      }
    } catch (error) {
      console.error(
        "⚠️  [MCP] Erro ao aplicar penalização por feedback negativo:",
        error instanceof Error ? error.message : error
      );
    }
  }

  return documents.slice(0, limit);
}

/**
 * Busca híbrida otimizada para o Modo Agente Beta.
 * Incorpora:
 *   1. Vetorização semântica da pergunta rica/contextualizada no bge-m3
 *   2. Busca Full-Text (FTS) com termos-chave tratados
 *   3. Re-ranking completo sobre 30 candidatos com afinidade de curso, período exato,
 *      código de disciplina, matriz curricular e penalizações cruzadas.
 */
async function searchDocumentsBeta(
  embedding: number[],
  semanticQuery: string,
  queryKeywords: string,
  limit: number,
  intent?: string
): Promise<RetrievedChunk[]> {
  const vectorStr = `[${embedding.join(",")}]`;
  const fullSearchText = `${semanticQuery || ""} ${queryKeywords || ""}`.trim();
  const ftsQuery = formatFTSQuery(queryKeywords || semanticQuery, intent, fullSearchText);
  const candidateLimit = Math.max(limit * 6, CANDIDATE_POOL_LIMIT);

  console.error(
    `🔍 [MCP Beta] Busca híbrida (α=${RRF_ALPHA}, k=${RRF_K}) | Intenção: [${intent || "N/A"}] | FTS: "${ftsQuery}"`
  );

  const result = await pool.query(
    `WITH
       semantic AS (
         SELECT id, content AS content,
           metadata->>'filename' AS source,
           metadata->>'pages' AS pages,
           metadata->>'sectionContext' AS section_context,
           metadata->>'sourceUrl' AS source_url,
           1 - (embedding <=> $1::vector) AS similarity,
           ROW_NUMBER() OVER (ORDER BY embedding <=> $1::vector) AS rank
         FROM documents
         ORDER BY embedding <=> $1::vector
         LIMIT 80
       ),
       lexical AS (
         SELECT id, content AS content,
           metadata->>'filename' AS source,
           metadata->>'pages' AS pages,
           metadata->>'sectionContext' AS section_context,
           metadata->>'sourceUrl' AS source_url,
           ts_rank_cd(content_tsv, to_tsquery('portuguese_unaccent', $2::text)) AS ts_score,
           ROW_NUMBER() OVER (
             ORDER BY ts_rank_cd(content_tsv, to_tsquery('portuguese_unaccent', $2::text)) DESC
           ) AS rank
         FROM documents
         WHERE content_tsv @@ to_tsquery('portuguese_unaccent', $2::text)
         ORDER BY ts_score DESC
         LIMIT 80
       ),
       hybrid_results AS (
         SELECT
           COALESCE(s.id, l.id) AS id,
           COALESCE(s.content, l.content) AS content,
           COALESCE(s.source, l.source) AS source,
           COALESCE(s.pages, l.pages) AS pages,
           COALESCE(s.section_context, l.section_context) AS section_context,
           COALESCE(s.source_url, l.source_url) AS source_url,
           COALESCE(s.similarity, 0) AS similarity,
           (
             ${RRF_ALPHA} * COALESCE(1.0 / (${RRF_K} + s.rank), 0.0) +
             ${1 - RRF_ALPHA} * COALESCE(1.0 / (${RRF_K} + l.rank), 0.0)
           ) AS rrf_score
         FROM semantic s
         FULL OUTER JOIN lexical l ON s.id = l.id
       )
     SELECT * FROM hybrid_results
     WHERE rrf_score >= ${MIN_RRF_SCORE}
     ORDER BY rrf_score DESC
     LIMIT $3`,
    [vectorStr, ftsQuery, candidateLimit]
  );

  let documents = result.rows.map((row) => enrichChunkMetadata(row));

  // ── Boost e Penalizações de Re-ranking sobre os candidatos ──
  applyRerankingBoosts(documents, fullSearchText, intent);
  documents.sort((a, b) => b.similarity - a.similarity);

  // ── Penalização por feedback negativo (ICL Dinâmico) ──
  if (documents.length > 0) {
    try {
      const chunkIds = documents.map((d) => d.id);
      const negResult = await pool.query(
        `SELECT unnest(chunk_ids) AS chunk_id, COUNT(*) AS neg_count
          FROM chat_feedbacks
          WHERE feedback_type = 'negative'
            AND chunk_ids && $1::integer[]
          GROUP BY chunk_id`,
        [chunkIds]
      );

      if (negResult.rows.length > 0) {
        const negatives = new Map<number, number>();
        for (const row of negResult.rows) {
          negatives.set(Number(row.chunk_id), Number(row.neg_count));
        }

        for (const doc of documents) {
          const negCount = negatives.get(doc.id) || 0;
          if (negCount > 0) {
            const originalScore = doc.similarity;
            doc.similarity *= 1 / (1 + PENALTY_BETA * negCount);
            console.error(
              `⚠️  [MCP Beta RRF] Chunk #${doc.id} penalizado: ` +
              `${negCount} negativo(s), score ${originalScore.toFixed(4)} → ${doc.similarity.toFixed(4)}`
            );
          }
        }

        documents.sort((a, b) => b.similarity - a.similarity);
      }
    } catch (error) {
      console.error(
        "⚠️  [MCP Beta] Erro ao aplicar penalização por feedback negativo:",
        error instanceof Error ? error.message : error
      );
    }
  }

  return documents.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Servidor MCP
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "chatifme-knowledge",
  version: "1.0.0",
});

/**
 * Tool: search_ifmg_knowledge
 *
 * Busca semântica nos documentos oficiais do curso de Sistemas de Informação
 * do IFMG Campus Ouro Branco. Mantida intacta para experimentos de baseline.
 */
// @ts-expect-error — TS2589: z.enum com 10 valores excede o limite de recursão do TypeScript nos generics do SDK MCP. Runtime funciona normalmente.
server.registerTool(
  "search_ifmg_knowledge",
  {
    description:
      "Busca informações nos documentos oficiais do curso de Sistemas de Informação do IFMG Campus Ouro Branco. " +
      "Use esta ferramenta para responder perguntas sobre regulamentos, PPC (Projeto Pedagógico do Curso), " +
      "grade curricular, normas acadêmicas, carga horária, TCC, estágio e informações do campus.\n\n" +
      "DIRETIVA OBRIGATÓRIA PARA O LLM: Extraia APENAS palavras-chave principais e nomes próprios da dúvida do usuário. " +
      "É EXPRESSAMENTE PROIBIDO enviar frases completas, pronomes, artigos ou conectivos.\n" +
      "Exemplo: Em vez de 'Qual a ementa de Cálculo I?', envie apenas 'ementa Cálculo I'. " +
      "Além disso, classifique a intenção da busca no parâmetro 'intent'.",
    inputSchema: {
      query: z.string().describe(
        "Apenas palavras-chave e nomes próprios. PROIBIDO frases completas, pronomes ou conectivos. Exemplo: 'carga horária Trabalho Conclusão Curso'"
      ),
      intent: z.enum([
        "INGRESSO_MATRICULA",
        "ESTRUTURA_CURSOS",
        "DISCIPLINA_EMENTA",
        "AVALIACAO_FREQUENCIA",
        "ESTAGIO_TCC",
        "ATIVIDADES_EXTRAS",
        "ASSISTENCIA_BOLSAS",
        "INFRA_CAMPUS",
        "DIREITOS_DEVERES",
        "OUTRAS"
      ]).describe(
        "Classifique a intenção da busca estritamente em uma destas categorias:\n" +
        "- INGRESSO_MATRICULA: Vestibular, SISU, transferências, trancamento, cancelamento ou renovação de matrícula.\n" +
        "- ESTRUTURA_CURSOS: Matriz curricular, PPC, duração, e regras gerais diferenciando Graduação (ex: Sistemas de Informação), Tecnólogos e Técnicos.\n" +
        "- DISCIPLINA_EMENTA: Carga horária específica, pré-requisitos, correquisitos, conteúdo programático e bibliografia.\n" +
        "- AVALIACAO_FREQUENCIA: Distribuição de pontos, média de aprovação, exames finais, limite de faltas (25%), abono e atestados médicos.\n" +
        "- ESTAGIO_TCC: Regras de estágio obrigatório/não obrigatório, documentação, orientadores e bancas de Trabalho de Conclusão de Curso.\n" +
        "- ATIVIDADES_EXTRAS: Horas complementares (AAC), pesquisa, extensão, monitoria e eventos acadêmicos.\n" +
        "- ASSISTENCIA_BOLSAS: Editais de assistência estudantil, auxílio moradia/transporte/alimentação e bolsas de estudo.\n" +
        "- INFRA_CAMPUS: Regras de uso da biblioteca, laboratórios, restaurante, horários de funcionamento, setores administrativos.\n" +
        "- DIREITOS_DEVERES: Regime disciplinar, sanções, advertências, infrações e direitos do corpo discente.\n" +
        "- OUTRAS: Assuntos que não se encaixam em nenhuma categoria acima."
      ),
    },
  },
  async ({ query, intent }) => {
    console.error(`🔍 [MCP] Buscando: "${query}" | Intenção: [${intent}]`);

    try {
      // 1. Vetorizar a query
      const embedding = await generateEmbedding(query);
      console.error(
        `🔢 [MCP] Embedding gerado (${embedding.length} dimensões)`
      );

      // 2. Buscar no banco (Híbrida com Threshold e Intent)
      const documents = await searchDocuments(embedding, query, MAX_RESULTS, intent);
      console.error(
        `📄 [MCP] ${documents.length} trechos encontrados (acima da nota de corte)`
      );

      // 3. Formatar resultado (Barreira contra alucinações)
      if (documents.length === 0) {
        console.error(`⚠️ [MCP] Nenhum documento superou o MIN_RRF_SCORE (${MIN_RRF_SCORE})`);
        return {
          content: [
            {
              type: "text" as const,
              text: "Nenhum trecho relevante encontrado nos documentos oficiais do IFMG para esta consulta. Responda ao usuário que você não encontrou a informação nos regulamentos atuais.",
            },
          ],
        };
      }

      const result = documents
        .map(
          (doc, i) =>
            `--- Trecho ${i + 1} (fonte: ${formatSourceDisplay(doc)}, score RRF: ${doc.similarity.toFixed(4)}) ---\n${doc.content}`
        )
        .join("\n\n");

      console.error(
        `✅ [MCP] Retornando ${documents.length} trechos ao agente`
      );

      return {
        content: [{ type: "text" as const, text: `[INTENÇÃO DA BUSCA: ${intent}]\n\n${result}` }],
      };
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error(`❌ [MCP] Erro na busca: ${msg}`);

      return {
        content: [
          {
            type: "text" as const,
            text: `Erro interno do banco de dados ao buscar nos documentos: ${msg}`,
          },
        ],
        isError: true,
      };
    }
  }
);

/**
 * Tool: search_ifmg_knowledge_beta
 *
 * Ferramenta aprimorada para o Modo Agente Beta.
 * Utiliza busca híbrida assimétrica (semantic_query para bge-m3 + keywords para FTS)
 * e re-ranking rigoroso para ementas, matrizes e códigos de disciplina.
 */
// @ts-expect-error — TS2589: z.enum com 10 valores excede o limite de recursão do TypeScript nos generics do SDK MCP. Runtime funciona normalmente.
server.registerTool(
  "search_ifmg_knowledge_beta",
  {
    description:
      "Busca semântica e léxica otimizada nos documentos oficiais do IFMG Campus Ouro Branco. " +
      "Use esta ferramenta para consultar regulamentos, matriz curricular, PPC, ementas de disciplinas, " +
      "regras de TCC, estágios e normas acadêmicas.\n\n" +
      "DIRETIVAS DE ENTRADA:\n" +
      "- 'semantic_query': Envie a pergunta ou descrição formal completa para o modelo neural denso.\n" +
      "- 'keywords': Envie palavras-chave essenciais e nomes de disciplinas/códigos para o índice léxico.\n" +
      "- 'intent': Classifique estritamente a intenção da busca.",
    inputSchema: {
      semantic_query: z.string().describe(
        "Pergunta contextualizada ou sentença descritiva completa para busca vetorial densa (bge-m3). Ex: 'Qual é a ementa e conteúdo programático da disciplina Banco de Dados I no curso de Sistemas?'"
      ),
      keywords: z.string().describe(
        "Palavras-chave essenciais, siglas expandidas e códigos de disciplina para busca Full-Text. Ex: 'ementa Banco de Dados I OBBGSIN.034'"
      ),
      intent: z.enum([
        "INGRESSO_MATRICULA",
        "ESTRUTURA_CURSOS",
        "DISCIPLINA_EMENTA",
        "AVALIACAO_FREQUENCIA",
        "ESTAGIO_TCC",
        "ATIVIDADES_EXTRAS",
        "ASSISTENCIA_BOLSAS",
        "INFRA_CAMPUS",
        "DIREITOS_DEVERES",
        "OUTRAS"
      ]).describe(
        "Classifique a intenção da busca em uma destas categorias:\n" +
        "- INGRESSO_MATRICULA: Vestibular, SISU, transferências, trancamento, cancelamento ou renovação.\n" +
        "- ESTRUTURA_CURSOS: Matriz curricular, listagem de matérias de um período/semestre, PPC, duração.\n" +
        "- DISCIPLINA_EMENTA: Ementa detalhada, pré-requisitos, correquisitos, conteúdo programático e bibliografia.\n" +
        "- AVALIACAO_FREQUENCIA: Pontuação, média, provas, faltas (25%), abono e atestados.\n" +
        "- ESTAGIO_TCC: Normas de estágio e Trabalho de Conclusão de Curso.\n" +
        "- ATIVIDADES_EXTRAS: Horas complementares (AAC), pesquisa, extensão e monitoria.\n" +
        "- ASSISTENCIA_BOLSAS: Assistência estudantil, transporte/mobilidade e bolsas.\n" +
        "- INFRA_CAMPUS: Biblioteca, laboratórios, localização de salas e setores, restaurante/refeitório.\n" +
        "- DIREITOS_DEVERES: Regime disciplinar e sanções.\n" +
        "- OUTRAS: Qualquer outro tema institucional."
      ),
    },
  },
  async ({ semantic_query, keywords, intent }) => {
    console.error(`🔍 [MCP Beta] Buscando: Semântica="${semantic_query}" | Keywords="${keywords}" | Intenção=[${intent}]`);

    try {
      const textToEmbed = semantic_query?.trim() || keywords?.trim() || "";
      const embedding = await generateEmbedding(textToEmbed);
      console.error(
        `🔢 [MCP Beta] Embedding gerado (${embedding.length} dimensões)`
      );

      const documents = await searchDocumentsBeta(
        embedding,
        semantic_query,
        keywords,
        MAX_RESULTS,
        intent
      );

      console.error(
        `📄 [MCP Beta] ${documents.length} trechos encontrados (acima da nota de corte)`
      );

      if (documents.length === 0) {
        console.error(`⚠️ [MCP Beta] Nenhum documento superou o MIN_RRF_SCORE (${MIN_RRF_SCORE})`);
        return {
          content: [
            {
              type: "text" as const,
              text: "Nenhum trecho relevante encontrado nos documentos oficiais do IFMG para esta consulta. Responda ao usuário que você não encontrou a informação nos regulamentos atuais.",
            },
          ],
        };
      }

      const result = documents
        .map(
          (doc, i) =>
            `--- Trecho ${i + 1} (fonte: ${formatSourceDisplay(doc)}, score RRF: ${doc.similarity.toFixed(4)}) ---\n${doc.content}`
        )
        .join("\n\n");

      console.error(
        `✅ [MCP Beta] Retornando ${documents.length} trechos otimizados ao agente`
      );

      return {
        content: [{ type: "text" as const, text: `[INTENÇÃO DA BUSCA: ${intent}]\n\n${result}` }],
      };
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error(`❌ [MCP Beta] Erro na busca: ${msg}`);

      return {
        content: [
          {
            type: "text" as const,
            text: `Erro interno do banco de dados ao buscar nos documentos: ${msg}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ---------------------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 [MCP Server] chatifme-knowledge iniciado (stdio)");
}

main().catch((err) => {
  console.error("❌ [MCP Server] Falha ao iniciar:", err);
  process.exit(1);
});