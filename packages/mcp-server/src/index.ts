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

/** Número máximo de trechos a retornar */
const MAX_RESULTS = 5;

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

/**
 * Formata a query para o formato tsquery do PostgreSQL (FTS).
 * Remove caracteres especiais, expande numerais ordinais e adiciona palavras de apoio da intenção (intent).
 */
function formatFTSQuery(query: string, intent?: string): string {
  const stopWords = new Set([
    "qual", "quais", "como", "onde", "quando", "para", "sobre", "entre", "este", "esta",
    "esses", "essas", "pode", "podia", "poderia", "favor", "voce", "sao", "tem", "ter",
    "conteudo", "conteúdo", "disciplina", "disciplinas", "detalhes", "programa"
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

  const codeMatch = query.match(/(OBBGSIN|OBBGADM|OBBGEMT|OBLCOMP|OBLPED)\.?(\d{3})/i);
  let codeFTS = "";
  if (codeMatch) {
    codeFTS = `(${codeMatch[1].toLowerCase()} & ${codeMatch[2]})`;
  }

  const queryLimpa = query.replace(/[^\p{L}\p{N}\s]/gu, " ").toLowerCase().trim();
  if (!queryLimpa) return codeFTS || "dummy_fallback_query";

  const rawTerms = queryLimpa.split(/\s+/).filter((w) => w.length >= 2 && !stopWords.has(w));
  const terms = rawTerms.map((w) => ordinalMap[w] || w);
  let mainFTS = terms.length > 0 ? terms.join(" & ") : "";

  if (codeFTS) {
    mainFTS = mainFTS ? `${codeFTS} | (${mainFTS})` : codeFTS;
  }

  if (!mainFTS) mainFTS = "dummy_fallback_query";

  const intentKeywords: Record<string, string> = {
    ESTRUTURA_CURSOS: "matriz | curricular | periodo",
    DISCIPLINA_EMENTA: "ementa | ementario | conteudo",
    CONTEUDO: "ementa | ementario | conteudo",
    INGRESSO_MATRICULA: "matricula | ingresso",
    AVALIACAO_FREQUENCIA: "frequencia | faltas | nota",
    ESTAGIO_TCC: "tcc | estagio",
    ATIVIDADES_EXTRAS: "complementares | extensao",
    ASSISTENCIA_BOLSAS: "bolsa | auxilio",
    INFRA_CAMPUS: "biblioteca | laboratorio",
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
 * Busca híbrida (vetorial + FTS) no pgvector usando Reciprocal Rank Fusion (RRF),
 * Limite de Corte e Penalização por Feedback Negativo.
 */
async function searchDocuments(
  embedding: number[],
  queryText: string,
  limit: number,
  intent?: string
): Promise<{ id: number; content: string; source: string; similarity: number }[]> {
  const vectorStr = `[${embedding.join(",")}]`;
  const ftsQuery = formatFTSQuery(queryText, intent);

  console.error(
    `🔍 [MCP] Busca híbrida (α=${RRF_ALPHA}, k=${RRF_K}) | Intenção: [${intent || "N/A"}] | FTS: "${ftsQuery}"`
  );

  const result = await pool.query(
    `WITH
       semantic AS (
         SELECT id, content AS content, metadata->>'filename' AS source,
           1 - (embedding <=> $1::vector) AS similarity,
           ROW_NUMBER() OVER (ORDER BY embedding <=> $1::vector) AS rank
         FROM documents
         ORDER BY embedding <=> $1::vector
         LIMIT 40
       ),
       lexical AS (
         SELECT id, content AS content, metadata->>'filename' AS source,
           ts_rank_cd(content_tsv, to_tsquery('portuguese_unaccent', $2::text)) AS ts_score,
           ROW_NUMBER() OVER (
             ORDER BY ts_rank_cd(content_tsv, to_tsquery('portuguese_unaccent', $2::text)) DESC
           ) AS rank
         FROM documents
         WHERE content_tsv @@ to_tsquery('portuguese_unaccent', $2::text)
         ORDER BY ts_score DESC
         LIMIT 40
       ),
       hybrid_results AS (
         SELECT
           COALESCE(s.id, l.id) AS id,
           COALESCE(s.content, l.content) AS content,
           COALESCE(s.source, l.source) AS source,
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
    [vectorStr, ftsQuery, limit]
  );

  let documents = result.rows.map((row) => ({
    id: Number(row.id),
    content: row.content,
    source: row.source || "documento desconhecido",
    similarity: Number(row.rrf_score),
  }));

  // ── Boost para trechos de Ementa quando a intenção for busca de ementa ──
  if (intent && (intent === "DISCIPLINA_EMENTA" || intent === "DISCIPLINA" || intent === "CONTEUDO")) {
    for (const doc of documents) {
      if (/ementa:/i.test(doc.content) || /conteudo programatico/i.test(doc.content)) {
        doc.similarity += 0.05; // Boost de prioridade no RRF para trazer a ementa como Documento 1
      }
    }
    documents.sort((a, b) => b.similarity - a.similarity);
  }

  // ── Penalização por feedback negativo (ICL Dinâmico) ──
  // Chunks com feedbacks negativos acumulados têm o score RRF reduzido:
  //   Score_final = Score_RRF × 1 / (1 + β × N_negativos)
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

        // Re-ordenar após penalização
        documents.sort((a, b) => b.similarity - a.similarity);
        documents = documents.slice(0, limit);
      }
    } catch (error) {
      // Falha silenciosa: se a tabela chat_feedbacks não existir ainda,
      // o pipeline continua sem penalização
      console.error(
        "⚠️  [MCP] Erro ao aplicar penalização por feedback negativo:",
        error instanceof Error ? error.message : error
      );
    }
  }

  return documents;
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
 * do IFMG Campus Ouro Branco. Vetoriza a query com bge-m3 e
 * consulta o PostgreSQL (pgvector) por trechos similares.
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
            `--- Trecho ${i + 1} (fonte: ${doc.source}, score RRF: ${doc.similarity.toFixed(4)}) ---\n${doc.content}`
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