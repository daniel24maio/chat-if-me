/**
 * Serviço de Sanitização de Texto
 *
 * Responsável por normalizar e limpar textos extraídos de documentos (PDF, Docx, planilhas),
 * removendo artefatos estruturais, ajustando hifenização e convertendo tabelas
 * para texto corrido, garantindo máxima qualidade para a etapa de Chunking e Embedding.
 */

// ---------------------------------------------------------------------------
// Expressões regulares pré-compiladas para performance.
// ---------------------------------------------------------------------------
const RE = {
  // Marcadores de página inseridos pela extração: "--- Página 5 ---"
  marcadorPagina: /---\s*P[aá]gina\s+\d+\s*---/gi,

  // Pilcrow (¶) e variantes de caracteres de formatação de parágrafo de PDF
  pilcrow: /[¶§]/g,

  // Superíndices e subíndices numéricos unicode (notas de rodapé, unidades)
  superSubIndices: /[\u00B9\u00B2\u00B3\u2070-\u2079\u2080-\u2089]/g,

  // Hifenização de palavras no final de linha: "infor-\nmação" → "informação"
  hifenQuebraDeLinha: /(\w)-\n(\w)/g,

  // Separadores decorativos de linha: "||", "| |", "___", "---", "==="
  separadoresDecorativos: /^[\s|_\-=]{3,}$/gm,

  // Linhas que são só pipe e espaço (resíduo de tabela sem conteúdo)
  linhasSoPipe: /^\s*\|[\s|]*\|\s*$/gm,

  // Múltiplos espaços e tabs → espaço único
  espacosMultiplos: /[ \t]{2,}/g,

  // Mais de 2 quebras de linha consecutivas → parágrafo duplo
  quebrasDeLinhaTriplas: /\n{3,}/g,

  // Linhas com menos de 3 caracteres não-espaço (ruído puro)
  linhasRuido: /^.{0,2}\n/gm,

  // Caracteres de controle não-visíveis (exceto \n e \t)
  caracteresControle: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,

  // Aspas tipográficas → ASCII
  aspasCurvas: /[\u201C\u201D]/g,
  aspasSimples: /[\u2018\u2019]/g,
  travessao: /[\u2013\u2014]/g,

  // Sequências de pontuação repetida decorativa: ".....", "-----"
  pontuacaoRepetida: /([.!?=\-_])\1{3,}/g,

  // Número de página solto: linha com apenas 1-4 dígitos
  numeroPaginaSolto: /^\s*\d{1,4}\s*$/gm,
};

/**
 * Converte uma linha de tabela markdown em texto corrido.
 *
 * Ex: "| OBBGSIN.031 | Probabilidade e Estatística | 64 |"
 *  →  "OBBGSIN.031 Probabilidade e Estatística 64"
 *
 * Isso é fundamental para a busca semântica: código e nome da disciplina
 * ficam no mesmo texto contínuo, permitindo busca por qualquer um dos dois.
 */
function tabelaMarkdownParaTexto(linha: string): string {
  if (!linha.includes("|")) return linha;
  if (/^\|[\s\-:|]+\|/.test(linha)) return "";

  return linha
    .split("|")
    .map((c) => c.trim())
    .filter((c) => c.length > 0 && !/^[-:]+$/.test(c))
    .join(" ");
}

/**
 * Percorre o texto linha a linha e converte tabelas markdown em texto corrido.
 */
function normalizarLinhasTabela(texto: string): string {
  return texto
    .split("\n")
    .map((linha) =>
      linha.includes("|") ? tabelaMarkdownParaTexto(linha) : linha
    )
    .filter((l) => l.trim().length > 0)
    .join("\n");
}

/**
 * Sanitiza texto extraído de PDF/imagem para uso no pipeline de embedding.
 *
 * Ordem das operações:
 *   1. Reconstrói palavras hifenadas entre linhas
 *   2. Remove marcadores estruturais (página, separadores, pilcrow)
 *   3. Converte tabelas markdown → texto corrido
 *   4. Remove linhas de ruído puro e números de página soltos
 *   5. Normaliza caracteres tipográficos e espaçamento
 */
export function sanitizarTexto(texto: string): string {
  const tamanhoOriginal = texto.length;

  let r = texto;

  // 1. Reconstrói palavras hifenadas ANTES de tudo (afeta estrutura de palavras)
  r = r.replace(RE.hifenQuebraDeLinha, "$1$2");

  // 2. Remove marcadores de página da extração
  r = r.replace(RE.marcadorPagina, "");

  // 3. Remove caracteres de controle invisíveis
  r = r.replace(RE.caracteresControle, "");

  // 4. Remove pilcrow e símbolos de parágrafo PDF
  r = r.replace(RE.pilcrow, "");

  // 5. Remove superíndices/subíndices (notas de rodapé)
  r = r.replace(RE.superSubIndices, "");

  // 6. Remove separadores decorativos de linha
  r = r.replace(RE.separadoresDecorativos, "");

  // 7. Converte tabelas markdown → texto corrido (crítico para busca semântica)
  r = normalizarLinhasTabela(r);

  // 8. Remove números de página soltos
  r = r.replace(RE.numeroPaginaSolto, "");

  // 9. Remove sequências de pontuação repetida decorativa
  r = r.replace(RE.pontuacaoRepetida, "$1");

  // 10. Normaliza caracteres tipográficos para ASCII
  r = r.replace(RE.aspasCurvas, '"');
  r = r.replace(RE.aspasSimples, "'");
  r = r.replace(RE.travessao, "-");

  // 11. Normaliza espaçamento: múltiplos espaços/tabs → espaço único
  r = r.replace(RE.espacosMultiplos, " ");

  // 12. Remove linhas com menos de 3 caracteres não-espaço (ruído puro)
  r = r.replace(RE.linhasRuido, "");

  // 13. Colapsa 3+ quebras de linha → dupla quebra (separador de parágrafo)
  r = r.replace(RE.quebrasDeLinhaTriplas, "\n\n");

  // 14. Trim final
  r = r.trim();

  const reducao = (
    ((tamanhoOriginal - r.length) / tamanhoOriginal) *
    100
  ).toFixed(1);
  console.log(
    `🧹 [Sanitização] ${tamanhoOriginal} → ${r.length} chars (redução: ${reducao}%)`
  );

  return r;
}
