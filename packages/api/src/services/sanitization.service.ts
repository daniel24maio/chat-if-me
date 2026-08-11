/**
 * Serviço de Sanitização de Texto — v2 (IFMG Legal Documents)
 *
 * Pipeline completo de limpeza para textos extraídos de PDFs institucionais
 * do IFMG (Regulamentos de Ensino, PPCs, Resoluções, etc.).
 *
 * Etapas do pipeline (em ordem):
 *   1. Limpeza de OCR (caracteres de controle, hifenização, BOM)
 *   2. Remoção de cabeçalhos/rodapés institucionais (SERVIÇO PÚBLICO FEDERAL, etc.)
 *   3. Poda de anexos (trunca tudo após ANEXO I / APÊNDICE)
 *   4. Conversão de tabelas markdown → texto corrido
 *   5. Remoção de artefatos estruturais (marcadores de página, separadores, pilcrow)
 *   6. Normalização tipográfica (aspas curvas → ASCII, travessões)
 *   7. Preparação para chunking jurídico (quebras duplas antes de Art., CAPÍTULO, etc.)
 *   8. Normalização final de espaçamento
 *
 * Exporta uma única função: sanitizeText(text: string): string
 */

// ---------------------------------------------------------------------------
// 1. LIMPEZA DE OCR
// ---------------------------------------------------------------------------

/**
 * Remove caracteres de controle invisíveis, BOM (Byte Order Mark) e lixo
 * comum de OCR de baixa qualidade (tesseract, Adobe Scan, etc.).
 *
 * Preserva \n e \t que são estruturalmente importantes.
 */
function cleanOCR(text: string): string {
  let resultText = text;

  // Remove BOM (U+FEFF) que alguns PDFs exportam no início
  resultText = resultText.replace(/\uFEFF/g, "");

  // Remove caracteres de controle não-visíveis (exceto \n=0x0A e \t=0x09)
  resultText = resultText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Remove caracteres de substituição Unicode (U+FFFD) — lixo de decodificação
  resultText = resultText.replace(/\uFFFD/g, "");

  // Remove soft-hyphen (U+00AD) — inserido por editores de texto
  resultText = resultText.replace(/\u00AD/g, "");

  // Remove zero-width spaces e joiners (invisíveis que bagunçam tokenização)
  resultText = resultText.replace(/[\u200B-\u200D\u2060\uFE0F]/g, "");

  // Remove form-feed (U+000C) que separa páginas em alguns PDFs
  resultText = resultText.replace(/\f/g, "\n");

  return resultText;
}

/**
 * Reconstrói palavras hifenizadas que foram separadas pela quebra de linha do PDF.
 *
 * Exemplos:
 *   "infor-\nmação"   → "informação"
 *   "pré-\nrequisito"  → "pré-requisito"  (prefixo preservado)
 *   "semi-\npresencial" → "semipresencial"
 *
 * Regra: só junta se a próxima linha começa com letra minúscula.
 * Se começa com maiúscula, mantém o hífen (pode ser nome próprio composto).
 */
function joinHyphenation(text: string): string {
  return text.replace(/(\w)-\n([a-záàâãéêíóôõúüç])/gi, (_, antes, depois) => {
    // Prefixos que devem manter o hífen (pré-, pós-, semi-, anti-, etc.)
    const prefixes = /(?:pr[eé]|p[oó]s|semi|anti|auto|contra|extra|infra|inter|intra|macro|micro|mini|multi|neo|proto|pseudo|sobre|sub|super|supra|ultra)$/i;
    if (prefixes.test(antes)) {
      return `${antes}-${depois}`;
    }
    return `${antes}${depois}`;
  });
}

// ---------------------------------------------------------------------------
// 2. REMOÇÃO DE CABEÇALHOS/RODAPÉS INSTITUCIONAIS DO IFMG
// ---------------------------------------------------------------------------

/**
 * Expressões regulares para cabeçalhos e rodapés recorrentes em documentos
 * oficiais do IFMG Campus Ouro Branco.
 *
 * Cada regex é case-insensitive e multiline para capturar variações
 * de formatação (maiúsculas, espaçamento, OCR com erros).
 */
const RE_CABECALHOS: RegExp[] = [
  // Cabeçalho institucional completo (pode aparecer em 1 a 4 linhas)
  /SERVI[CÇ]O\s+P[UÚ]BLICO\s+FEDERAL/gi,
  /MINIST[EÉ]RIO\s+DA\s+EDUCA[CÇ][AÃ]O/gi,
  /INSTITUTO\s+FEDERAL\s+DE\s+EDUCA[CÇ][AÃ]O[\s,]*CI[EÊ]NCIA\s+E\s+TECNOLOGIA\s+DE\s+MINAS\s+GERAIS/gi,
  /SECRETARIA\s+DE\s+EDUCA[CÇ][AÃ]O\s+PROFISSIONAL\s+E\s+TECNOL[OÓ]GICA/gi,

  // Variação abreviada: "IFMG - Campus Ouro Branco" ou "IFMG – Campus Ouro Branco"
  /IFMG\s*[-–—]\s*Campus\s+Ouro\s+Branco/gi,
  /Campus\s+Ouro\s+Branco/gi,

  // Endereço institucional (Rua/Av. Afonso Sardinha, nº, bairro, CEP)
  /(?:Rua|Av\.?|Avenida)\s+Afonso\s+Sardinha[^\n]*/gi,
  /CEP[\s.:]*\d{2}\.?\d{3}[-.]?\d{3}/gi,

  // Telefone institucional: (31) 3938-xxxx, 31-3938-xxxx, etc.
  /(?:\(\d{2}\)\s*|\d{2}[-\s])\d{4}[-.\s]\d{4}/g,

  // E-mails institucionais do IFMG
  /[\w.-]+@ifmg\.edu\.br/gi,

  // URLs institucionais
  /(?:https?:\/\/)?(?:www\.)?ifmg\.edu\.br[^\s]*/gi,

  // Rodapés tipo "Página X de Y" ou "X/Y"
  /P[aá]gina\s+\d+\s+de\s+\d+/gi,
  /^\s*\d{1,4}\s*\/\s*\d{1,4}\s*$/gm,
];

/**
 * Remove todas as ocorrências de cabeçalhos e rodapés institucionais do IFMG.
 * Aplicado linha a linha para evitar remoções acidentais em meio a parágrafos.
 */
function removeHeadersFooters(text: string): string {
  let resultText = text;

  for (const regex of RE_CABECALHOS) {
    // Reseta lastIndex para regexes com flag 'g'
    regex.lastIndex = 0;
    resultText = resultText.replace(regex, "");
  }

  return resultText;
}

// ---------------------------------------------------------------------------
// 3. PODA DE ANEXOS (TRUNCAMENTO)
// ---------------------------------------------------------------------------

/**
 * Trunca o texto ao encontrar a primeira ocorrência de um marcador de anexo.
 *
 * Documentos legais do IFMG frequentemente terminam com formulários em branco
 * (atas, requerimentos, declarações) que são ruído puro para o RAG.
 *
 * Marcadores reconhecidos:
 *   - "ANEXO I", "ANEXO II", "ANEXO A", "ANEXO B"
 *   - "ANEXO 1", "ANEXO 2"
 *   - "APÊNDICE A", "APÊNDICE I", "APÊNDICE 1"
 *
 * O marcador deve estar no início de uma linha (com possível espaço antes)
 * para evitar falsos positivos em frases como "conforme Anexo I do regulamento".
 */
function pruneAppendices(text: string): string {
  // Busca ANEXO ou APÊNDICE no início de uma linha, seguido de número romano, letra ou dígito
  const match = text.match(
    /^[\t ]*(?:ANEXO|AP[EÊ]NDICE)\s+[IVXLCDM\dA-Z]+/im
  );

  if (match && match.index !== undefined) {
    const prunedText = text.slice(0, match.index).trim();
    const discarded = text.length - prunedText.length;
    console.log(
      `✂️  [Sanitização] Anexo detectado ("${match[0].trim()}"). ` +
      `Descartados ${discarded} chars de formulários/anexos.`
    );
    return prunedText;
  }

  return text;
}

// ---------------------------------------------------------------------------
// 4. PREPARAÇÃO PARA CHUNKING SEMÂNTICO JURÍDICO
// ---------------------------------------------------------------------------

/**
 * Prepara o texto para que o text splitter corte nos lugares certos.
 *
 * Em documentos jurídicos, um artigo e os seus incisos (I, II, III, §1º, etc.)
 * devem permanecer no mesmo chunk para preservar o contexto legal.
 *
 * Esta função faz duas coisas:
 * 4. PREPARAÇÃO PARA CHUNKING NORMATIVO (Artigos, Capítulos, Seções)
 *
 *   A) Remove quebras de linha isoladas (\n) no meio de frases para que
 *      artigos com incisos em múltiplas linhas virem um bloco contínuo.
 *
 *   B) Garante uma quebra dupla (\n\n) ANTES dos marcadores estruturais
 *      (Art., CAPÍTULO, TÍTULO, Seção, RESOLUÇÃO, DAS DISPOSIÇÕES, etc.)
 *      para que o text splitter crie um novo chunk nesses pontos.
 */
function prepareNormativeChunking(text: string): string {
  let resultText = text;

  // ── Passo A: Colapsar quebras simples em espaço ──
  // Regra: se uma linha termina com letra/pontuação normal e a próxima
  // começa com letra minúscula, número romano ou alínea, é continuação.
  // Preserva quebras duplas (\n\n) que já existem.
  resultText = resultText.replace(/([^\n])\n(?!\n)([^\n])/g, (_, antes, depois) => {
    // Se a próxima linha começa com um marcador estrutural, NÃO colapsar
    if (/^(?:Art\.\s|CAP[IÍ]TULO|T[IÍ]TULO|Se[cç][aã]o|RESOLU[CÇ])/i.test(depois + resultText.charAt(0))) {
      return `${antes}\n\n${depois}`;
    }
    return `${antes} ${depois}`;
  });

  // ── Passo B: Garantir \n\n antes de marcadores estruturais ──
  // Lista de marcadores que indicam início de nova seção/artigo
  const markers = [
    /(?<!\n\n)(?=^[\t ]*Art\.\s)/gm,                          // Art. 1º, Art. 2º, ...
    /(?<!\n\n)(?=^[\t ]*CAP[IÍ]TULO\s)/gm,                    // CAPÍTULO I, II, ...
    /(?<!\n\n)(?=^[\t ]*T[IÍ]TULO\s)/gm,                      // TÍTULO I, II, ...
    /(?<!\n\n)(?=^[\t ]*Se[cç][aã]o\s)/gm,                    // Seção I, Seção II, ...
    /(?<!\n\n)(?=^[\t ]*RESOLU[CÇ][AÃ]O\s)/gm,               // RESOLUÇÃO Nº ...
    /(?<!\n\n)(?=^[\t ]*DAS?\s+DISPOSI[CÇ][OÕ]ES\s)/gm,      // DAS DISPOSIÇÕES ...
    /(?<!\n\n)(?=^[\t ]*DO\s+REGIME\s)/gm,                    // DO REGIME ...
    /(?<!\n\n)(?=^[\t ]*DA\s+ORGANIZA[CÇ][AÃ]O\s)/gm,        // DA ORGANIZAÇÃO ...
    /(?<!\n\n)(?=^[\t ]*DOS?\s+DIREITOS?\s)/gm,               // DOS DIREITOS ...
    /(?<!\n\n)(?=^[\t ]*DOS?\s+DEVERES?\s)/gm,                // DOS DEVERES ...
  ];

  for (const regex of markers) {
    resultText = resultText.replace(regex, "\n\n");
  }

  return resultText;
}

// ---------------------------------------------------------------------------
// 5. ARTEFATOS ESTRUTURAIS DE PDF
// ---------------------------------------------------------------------------

/** Expressões regulares pré-compiladas para remoção de artefatos. */
const PATTERNS = {
  // Marcadores de página inseridos pela extração: "--- Página 5 ---"
  pageMarker: /---\s*P[aá]gina\s+\d+\s*---/gi,

  // Pilcrow (¶) e símbolos de parágrafo PDF
  pilcrow: /[¶§]/g,

  // Superíndices e subíndices numéricos unicode (notas de rodapé)
  superSubIndices: /[\u00B9\u00B2\u00B3\u2070-\u2079\u2080-\u2089]/g,

  // Separadores decorativos de linha: "||", "| |", "___", "---", "==="
  decorativeSeparators: /^[\s|_\-=]{3,}$/gm,

  // Linhas que são só pipe e espaço (resíduo de tabela sem conteúdo)
  linesOnlyPipe: /^\s*\|[\s|]*\|\s*$/gm,

  // Número de página solto: linha com apenas 1-4 dígitos
  loosePageNumber: /^\s*\d{1,4}\s*$/gm,

  // Sequências de pontuação repetida decorativa: ".....", "-----"
  repeatedPunctuation: /([.!?=\-_])\1{3,}/g,

  // Aspas tipográficas → ASCII
  curlyQuotes: /[\u201C\u201D]/g,
  singleQuotes: /[\u2018\u2019]/g,
  dash: /[\u2013\u2014]/g,

  // Múltiplos espaços e tabs → espaço único
  multipleSpaces: /[ \t]{2,}/g,

  // Mais de 2 quebras de linha consecutivas → parágrafo duplo
  tripleLineBreaks: /\n{3,}/g,

  // Linhas com menos de 3 caracteres não-espaço (ruído puro)
  noiseLines: /^.{0,2}\n/gm,
};

// ---------------------------------------------------------------------------
// 6. CONVERSÃO DE TABELAS MARKDOWN → TEXTO CORRIDO
// ---------------------------------------------------------------------------

/**
 * Converte uma linha de tabela markdown em texto corrido.
 *
 * Ex: "| OBBGSIN.031 | Probabilidade e Estatística | 64 |"
 *  →  "OBBGSIN.031 Probabilidade e Estatística 64"
 *
 * Isso é fundamental para a busca semântica: código e nome da disciplina
 * ficam no mesmo texto contínuo, permitindo busca por qualquer um dos dois.
 */
function markdownTableToText(line: string): string {
  if (!line.includes("|")) return line;
  // Pula linhas separadoras de tabela markdown: | --- | --- |
  if (/^\|[\s\-:|]+\|/.test(line)) return "";

  return line
    .split("|")
    .map((c) => c.trim())
    .filter((c) => c.length > 0 && !/^[-:]+$/.test(c))
    .join(" ");
}

/**
 * Percorre o texto linha a linha e converte tabelas markdown em texto corrido.
 */
function normalizeTableLines(text: string): string {
  return text
    .split("\n")
    .map((line) =>
      line.includes("|") ? markdownTableToText(line) : line
    )
    .filter((l) => l.trim().length > 0)
    .join("\n");
}

// ---------------------------------------------------------------------------
// PIPELINE PRINCIPAL
// ---------------------------------------------------------------------------

/**
 * Sanitiza texto extraído de documentos PDF/Word/imagem do IFMG para uso
 * no pipeline de Embedding e RAG.
 *
 * Ordem do pipeline:
 *   1. Limpeza de OCR (caracteres invisíveis, BOM, lixo)
 *   2. Reconstituição de palavras hifenizadas
 *   3. Remoção de cabeçalhos/rodapés institucionais do IFMG
 *   4. Poda de anexos (trunca formulários vazios)
 *   5. Remoção de marcadores de página
 *   6. Remoção de artefatos estruturais (pilcrow, separadores, etc.)
 *   7. Conversão de tabelas markdown → texto corrido
 *   8. Normalização tipográfica (aspas, travessões)
 *   9. Preparação para chunking jurídico (quebras antes de Art., CAPÍTULO, etc.)
 *  10. Normalização final de espaçamento
 *
 * @param text - Texto bruto extraído do documento
 * @returns Texto sanitizado pronto para chunking e embedding
 */
export function sanitizeText(text: string): string {
  const originalSize = text.length;

  let resultText = text;

  // ── 1. Limpeza de OCR ──
  resultText = cleanOCR(resultText);

  // ── 2. Reconstrói palavras hifenizadas ANTES de tudo (afeta estrutura de palavras) ──
  resultText = joinHyphenation(resultText);

  // ── 3. Remove cabeçalhos/rodapés institucionais do IFMG ──
  resultText = removeHeadersFooters(resultText);

  // ── 4. Poda de anexos (trunca formulários vazios) ──
  resultText = pruneAppendices(resultText);

  // ── 5. Remove marcadores de página da extração ──
  resultText = resultText.replace(PATTERNS.pageMarker, "");

  // ── 6. Remove caracteres de parágrafo PDF ──
  resultText = resultText.replace(PATTERNS.pilcrow, "");

  // ── 7. Remove superíndices/subíndices (notas de rodapé) ──
  resultText = resultText.replace(PATTERNS.superSubIndices, "");

  // ── 8. Remove separadores decorativos de linha ──
  resultText = resultText.replace(PATTERNS.decorativeSeparators, "");

  // ── 9. Remove linhas só com pipes (tabela vazia) ──
  resultText = resultText.replace(PATTERNS.linesOnlyPipe, "");

  // ── 10. Converte tabelas markdown → texto corrido ──
  resultText = normalizeTableLines(resultText);

  // ── 11. Remove números de página soltos ──
  resultText = resultText.replace(PATTERNS.loosePageNumber, "");

  // ── 12. Remove sequências de pontuação repetida decorativa ──
  resultText = resultText.replace(PATTERNS.repeatedPunctuation, "$1");

  // ── 13. Normaliza caracteres tipográficos para ASCII ──
  resultText = resultText.replace(PATTERNS.curlyQuotes, '"');
  resultText = resultText.replace(PATTERNS.singleQuotes, "'");
  resultText = resultText.replace(PATTERNS.dash, "-");

  // ── 14. Preparação para chunking normativo ──
  // Colapsa \n isolados e garante \n\n antes de marcadores estruturais
  resultText = prepareNormativeChunking(resultText);

  // ── 15. Normaliza espaçamento: múltiplos espaços/tabs → espaço único ──
  resultText = resultText.replace(PATTERNS.multipleSpaces, " ");

  // ── 16. Remove linhas com menos de 3 caracteres (ruído puro) ──
  resultText = resultText.replace(PATTERNS.noiseLines, "");

  // ── 17. Colapsa 3+ quebras de linha → dupla quebra (separador de parágrafo) ──
  resultText = resultText.replace(PATTERNS.tripleLineBreaks, "\n\n");

  // ── 18. Trim final ──
  resultText = resultText.trim();

  // Log de redução
  const reduction = (
    ((originalSize - resultText.length) / originalSize) *
    100
  ).toFixed(1);
  console.log(
    `🧹 [Sanitização] ${originalSize} → ${resultText.length} chars (redução: ${reduction}%)`
  );

  return resultText;
}
