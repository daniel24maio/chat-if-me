import type { DocumentoRecuperado } from "../interfaces/chat.interfaces.js";

/**
 * Serviço RAG (Retrieval-Augmented Generation).
 *
 * Este módulo concentra o núcleo do TCC: receber a pergunta do aluno,
 * buscar trechos relevantes nos documentos do curso e gerar uma resposta
 * contextualizada usando um LLM local.
 *
 * Fluxo completo (a ser implementado):
 *   1. Vetorizar a pergunta usando um modelo de Embeddings.
 *   2. Buscar documentos similares no PostgreSQL com pgvector.
 *   3. Montar o prompt com os trechos recuperados.
 *   4. Enviar o prompt ao LLM local (Ollama) e retornar a resposta.
 */

// ---------------------------------------------------------------------------
// Etapa 1 — Vetorização (Embeddings)
// ---------------------------------------------------------------------------

/**
 * Converte o texto da pergunta em um vetor numérico (embedding).
 * Será implementado com a API de Embeddings do Ollama ou outro provider.
 *
 * @param texto - Texto a ser vetorizado (pergunta do aluno)
 * @returns Vetor numérico representando o texto no espaço semântico
 */
async function gerarEmbedding(texto: string): Promise<number[]> {
  // TODO: Implementar chamada HTTP ao Ollama (POST /api/embeddings)
  //       com o modelo de embeddings escolhido (ex.: nomic-embed-text).
  //
  // Exemplo esperado:
  //   const response = await fetch("http://localhost:11434/api/embeddings", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ model: "nomic-embed-text", prompt: texto }),
  //   });
  //   const data = await response.json();
  //   return data.embedding;

  console.log(`[Embedding] Vetorizando texto: "${texto.substring(0, 50)}..."`);
  return []; // placeholder — retorna vetor vazio por enquanto
}

// ---------------------------------------------------------------------------
// Etapa 2 — Busca Semântica (pgvector)
// ---------------------------------------------------------------------------

/**
 * Busca os trechos de documentos mais similares à pergunta no banco de dados.
 * Utiliza a extensão pgvector do PostgreSQL para busca por similaridade de cosseno.
 *
 * @param embedding - Vetor da pergunta gerado na Etapa 1
 * @param limite    - Número máximo de documentos a retornar (default: 5)
 * @returns Lista de documentos recuperados ordenados por similaridade
 */
async function buscarDocumentosSimilares(
  embedding: number[],
  limite: number = 5
): Promise<DocumentoRecuperado[]> {
  // TODO: Implementar consulta SQL ao PostgreSQL com pgvector.
  //
  // Exemplo esperado:
  //   const query = `
  //     SELECT conteudo, origem, 1 - (embedding <=> $1) AS similaridade
  //     FROM documentos
  //     ORDER BY embedding <=> $1
  //     LIMIT $2
  //   `;
  //   const resultado = await pool.query(query, [embedding, limite]);
  //   return resultado.rows;

  console.log(
    `[pgvector] Buscando ${limite} documentos similares (embedding de ${embedding.length} dimensões)`
  );
  return []; // placeholder — retorna lista vazia por enquanto
}

// ---------------------------------------------------------------------------
// Etapa 3 — Geração de Resposta (LLM via Ollama)
// ---------------------------------------------------------------------------

/**
 * Monta o prompt contextualizado e envia ao LLM local para geração de resposta.
 *
 * @param pergunta   - Pergunta original do aluno
 * @param documentos - Trechos recuperados na Etapa 2 para compor o contexto
 * @returns Texto da resposta gerada pelo modelo
 */
async function gerarRespostaLLM(
  pergunta: string,
  documentos: DocumentoRecuperado[]
): Promise<string> {
  // TODO: Implementar chamada HTTP ao Ollama (POST /api/generate ou /api/chat)
  //       com o modelo escolhido (ex.: gemma:2b, qwen:1.8b).
  //
  // O prompt seguirá o padrão RAG:
  //   - System: instruções de comportamento (responder apenas com base no contexto)
  //   - Context: trechos dos documentos recuperados
  //   - User: pergunta do aluno
  //
  // Exemplo esperado:
  //   const prompt = `
  //     Você é um assistente do curso de Sistemas de Informação do IFMG Ouro Branco.
  //     Use APENAS as informações abaixo para responder à pergunta do aluno.
  //     Se a resposta não estiver no contexto, diga que não encontrou a informação.
  //
  //     Contexto:
  //     ${documentos.map((d) => d.conteudo).join("\n---\n")}
  //
  //     Pergunta: ${pergunta}
  //   `;
  //   const response = await fetch("http://localhost:11434/api/generate", { ... });

  console.log(
    `[LLM] Gerando resposta para: "${pergunta.substring(0, 50)}..." com ${documentos.length} documentos de contexto`
  );

  return "Esta é uma resposta placeholder. O pipeline RAG completo será implementado nas próximas etapas.";
}

// ---------------------------------------------------------------------------
// Função principal — Orquestra todo o pipeline RAG
// ---------------------------------------------------------------------------

/**
 * Executa o pipeline completo de RAG para responder à pergunta do aluno.
 * Orquestra as três etapas: Embedding → Busca → Geração.
 *
 * @param pergunta - Pergunta do aluno extraída do body da requisição
 * @returns Objeto com a resposta gerada e as fontes utilizadas
 */
export async function processarPergunta(
  pergunta: string
): Promise<{ resposta: string; fontes: string[] }> {
  // Etapa 1: Vetorizar a pergunta
  const embedding = await gerarEmbedding(pergunta);

  // Etapa 2: Buscar documentos relevantes no banco
  const documentos = await buscarDocumentosSimilares(embedding);

  // Etapa 3: Gerar resposta com o LLM usando os documentos como contexto
  const resposta = await gerarRespostaLLM(pergunta, documentos);

  // Extrair as fontes dos documentos recuperados para referência
  const fontes = documentos.map(
    (doc) => `${doc.origem} (similaridade: ${doc.similaridade.toFixed(2)})`
  );

  return { resposta, fontes };
}
