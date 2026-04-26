import type { Response } from "express";
import type { DocumentoRecuperado } from "../interfaces/chat.interfaces.js";
import { pool } from "../config/database.js";
import {
  gerarEmbeddingOllama,
  streamRespostaOllama,
  reescreverComLLM,
  type OllamaChatMessage,
} from "../config/ollama.js";

/**
 * Serviço RAG (Retrieval-Augmented Generation) com Streaming.
 *
 * Núcleo do TCC: recebe a pergunta do aluno, busca trechos relevantes
 * nos documentos do curso e faz streaming da resposta do LLM token a token.
 *
 * Fluxo completo:
 *   0. Reescrever a pergunta para expandir siglas e formalizar (Query Rewriting).
 *   1. Vetorizar a pergunta REESCRITA usando o modelo de Embeddings (Ollama).
 *   2. Buscar documentos similares no PostgreSQL com pgvector (com threshold).
 *   3. Montar o System Prompt RAG com os trechos recuperados.
 *   4. Fazer streaming da resposta do LLM diretamente para o frontend via SSE.
 */

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

/**
 * Threshold mínimo de similaridade de cosseno (0 a 1).
 * Trechos com similaridade abaixo desse valor são descartados para evitar
 * que contexto irrelevante polua a resposta e cause alucinações.
 *
 * Decisão de projeto: 0.3 é um bom ponto de partida — suficientemente
 * permissivo para capturar resultados parciais, mas filtra ruído total.
 * Ajustar empiricamente conforme os resultados observados.
 */


// ---------------------------------------------------------------------------
// Etapa 0 — Query Rewriting (Reescrita de Pergunta)
// ---------------------------------------------------------------------------

/**
 * System Prompt para o LLM de reescrita.
 *
 * Contém o dicionário de siglas acadêmicas do IFMG e regras para
 * formalizar a linguagem sem alterar o sentido da pergunta.
 */
const REWRITE_SYSTEM_PROMPT = `Você é um assistente de pré-processamento de consultas para um sistema de busca de documentos acadêmicos do IFMG (Instituto Federal de Minas Gerais), Campus Ouro Branco, curso de Sistemas de Informação.

Sua tarefa: reescrever a pergunta do usuário para melhorar a busca semântica em documentos acadêmicos.

REGRAS:
1. Expanda TODAS as siglas acadêmicas:
   - TCC → Trabalho de Conclusão de Curso
   - PPC → Projeto Pedagógico do Curso
   - CR → Coeficiente de Rendimento
   - ENADE → Exame Nacional de Desempenho de Estudantes
   - TI → Tecnologia da Informação
   - SI → Sistemas de Informação
   - IFMG → Instituto Federal de Minas Gerais
   - NDE → Núcleo Docente Estruturante
   - CEAD → Centro de Educação Aberta e a Distância
   - IRA → Índice de Rendimento Acadêmico
   - AC → Atividades Complementares
   - DP → Dependência (disciplina em dependência)
2. Transforme linguagem coloquial em linguagem formal/acadêmica.
3. Adicione contexto implícito quando cabível (ex: "reprovar" → "critérios de reprovação").
4. Mantenha o sentido original da pergunta.
5. Responda APENAS com a pergunta reescrita, sem explicações, sem aspas, sem prefixos.`;

/**
 * Reescreve a pergunta do aluno para melhorar a qualidade da busca semântica.
 *
 * Usa um LLM leve (qwen3.5) para expandir siglas e formalizar a linguagem,
 * produzindo um texto que se alinha melhor com o vocabulário dos documentos
 * oficiais do IFMG armazenados no pgvector.
 *
 * Fallback: se a reescrita falhar (ex: Ollama offline), usa a pergunta original.
 *
 * @param pergunta - Pergunta original do aluno
 * @returns Pergunta reescrita e expandida
 */
async function reescreverPergunta(pergunta: string): Promise<string> {
  try {
    console.log(`✍️  [Reescrita] Original: "${pergunta}"`);

    const reescrita = await reescreverComLLM(REWRITE_SYSTEM_PROMPT, pergunta);

    // Validação: se a reescrita ficou vazia ou absurdamente longa, usa a original
    if (!reescrita || reescrita.length > 1000) {
      console.log(`✍️  [Reescrita] Resultado inválido, usando original.`);
      return pergunta;
    }

    console.log(`✍️  [Reescrita] Resultado: "${reescrita}"`);
    return reescrita;
  } catch (error) {
    // Fallback gracioso: se a reescrita falhar, não bloqueia o pipeline
    console.warn(
      `⚠️  [Reescrita] Falha na reescrita, usando pergunta original:`,
      error instanceof Error ? error.message : error
    );
    return pergunta;
  }
}

// ---------------------------------------------------------------------------
// Etapa 1 — Vetorização (Embeddings)
// ---------------------------------------------------------------------------

/**
 * Converte o texto da pergunta em um vetor numérico (embedding).
 * Utiliza o modelo configurado no Ollama (ex: nomic-embed-text, 768 dimensões).
 *
 * @param texto - Texto a ser vetorizado (pergunta do aluno)
 * @returns Vetor numérico representando o texto no espaço semântico
 */
async function gerarEmbedding(texto: string): Promise<number[]> {
  console.log(`🔢 [RAG] Vetorizando pergunta: "${texto.substring(0, 60)}..."`);

  const embedding = await gerarEmbeddingOllama(texto);

  console.log(
    `🔢 [RAG] Embedding gerado com sucesso (${embedding.length} dimensões)`
  );

  return embedding;
}

// ---------------------------------------------------------------------------
// Etapa 2 — Busca Híbrida (pgvector + Full-Text Search) com RRF
// ---------------------------------------------------------------------------

/**
 * Parâmetros do Reciprocal Rank Fusion (RRF).
 *
 * k: constante de suavização (60 é padrão da literatura).
 * alpha: peso da busca semântica (0.5 = peso igual para ambas).
 */
const RRF_K = 60;
const RRF_ALPHA = 0.5;

/**
 * Busca híbrida: combina busca vetorial (pgvector) com Full-Text Search
 * (tsvector/tsquery) usando Reciprocal Rank Fusion (RRF).
 *
 * RRF: Score_final = α × 1/(k + rank_semântico) + (1-α) × 1/(k + rank_lexical)
 *
 * Isso garante que:
 * - Buscas semânticas funcionem para perguntas conceituais
 * - Nomes exatos de disciplinas/siglas subam ao topo via FTS
 *
 * @param embedding  - Vetor da pergunta (para busca semântica)
 * @param queryTexto - Texto da pergunta (para Full-Text Search)
 * @param limite     - Número máximo de resultados (default: 5)
 */
async function buscarHibrido(
  embedding: number[],
  queryTexto: string,
  limite: number = 5
): Promise<DocumentoRecuperado[]> {
  console.log(
    `🔍 [RAG] Busca híbrida: vetorial (α=${RRF_ALPHA}) + FTS (1-α=${1 - RRF_ALPHA}), k=${RRF_K}`
  );

  const vectorStr = `[${embedding.join(",")}]`;

  const result = await pool.query(
    `WITH
       semantic AS (
         SELECT id, content AS conteudo, metadata->>'filename' AS origem,
           1 - (embedding <=> $1::vector) AS similaridade,
           ROW_NUMBER() OVER (ORDER BY embedding <=> $1::vector) AS rank
         FROM documents
         ORDER BY embedding <=> $1::vector
         LIMIT 20
       ),
       lexical AS (
         SELECT id, content AS conteudo, metadata->>'filename' AS origem,
           ts_rank_cd(content_tsv, plainto_tsquery('portuguese_unaccent', $2)) AS ts_score,
           ROW_NUMBER() OVER (
             ORDER BY ts_rank_cd(content_tsv, plainto_tsquery('portuguese_unaccent', $2)) DESC
           ) AS rank
         FROM documents
         WHERE content_tsv @@ plainto_tsquery('portuguese_unaccent', $2)
         ORDER BY ts_score DESC
         LIMIT 20
       )
     SELECT
       COALESCE(s.id, l.id) AS id,
       COALESCE(s.conteudo, l.conteudo) AS conteudo,
       COALESCE(s.origem, l.origem) AS origem,
       COALESCE(s.similaridade, 0) AS similaridade,
       (
         ${RRF_ALPHA} * COALESCE(1.0 / (${RRF_K} + s.rank), 0.0) +
         ${1 - RRF_ALPHA} * COALESCE(1.0 / (${RRF_K} + l.rank), 0.0)
       ) AS rrf_score
     FROM semantic s
     FULL OUTER JOIN lexical l ON s.id = l.id
     ORDER BY rrf_score DESC
     LIMIT $3`,
    [vectorStr, queryTexto, limite]
  );

  const documentos: DocumentoRecuperado[] = result.rows.map((row) => ({
    conteudo: row.conteudo,
    origem: row.origem || "documento desconhecido",
    similaridade: Number(row.rrf_score),
  }));

  if (documentos.length === 0) {
    console.log(`🔍 [RAG] Nenhum documento encontrado (vetorial + FTS).`);
  } else {
    console.log(`🔍 [RAG] ${documentos.length} documentos (RRF híbrido):`);
    documentos.forEach((doc, i) => {
      console.log(
        `   ${i + 1}. [RRF: ${doc.similaridade.toFixed(4)}] ${doc.origem}: "${doc.conteudo.substring(0, 50)}..."`
      );
    });
  }

  return documentos;
}

// ---------------------------------------------------------------------------
// Etapa 3 — Montagem do System Prompt RAG
// ---------------------------------------------------------------------------

/**
 * Monta as mensagens do chat (system + user) para enviar ao LLM.
 *
 * O System Prompt instrui o modelo a:
 *   - Responder APENAS com base no contexto fornecido
 *   - Informar quando não encontrar a resposta nos documentos
 *   - Manter um tom educado e informativo
 *   - NÃO inventar informações (anti-alucinação)
 */
function montarMensagensRAG(
  pergunta: string,
  documentos: DocumentoRecuperado[]
): OllamaChatMessage[] {
  // Monta o contexto a partir dos documentos recuperados
  const contexto =
    documentos.length > 0
      ? documentos
        .map(
          (doc, i) =>
            `--- Trecho ${i + 1} (fonte: ${doc.origem}, similaridade: ${doc.similaridade.toFixed(2)}) ---\n${doc.conteudo}`
        )
        .join("\n\n")
      : "Nenhum documento relevante foi encontrado na base de conhecimento.";

  // System Prompt RAG rigoroso contra alucinações
  const systemPrompt = `Você é o chatIFme, assistente virtual oficial do curso de Sistemas de Informação do IFMG Campus Ouro Branco.

Sua função é responder dúvidas dos alunos sobre regulamentos, PPC (Projeto Pedagógico do Curso), grade curricular, normas acadêmicas e informações do campus.

REGRAS OBRIGATÓRIAS (siga rigorosamente):
1. Use EXCLUSIVAMENTE as informações dos trechos de documentos fornecidos abaixo.
2. NÃO invente, suponha ou complemente com conhecimento externo.
3. Se a resposta não estiver nos trechos, diga: "Não encontrei essa informação nos documentos disponíveis. Recomendo consultar a coordenação do curso ou acessar o portal do IFMG."
4. Seja educado, objetivo e claro.
5. Cite a fonte (nome do documento) quando possível.
6. Responda sempre em português brasileiro.
7. Formate a resposta de forma organizada (use listas quando apropriado).

CONTEXTO (trechos dos documentos oficiais do curso):
${contexto}`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: pergunta },
  ];
}

// ---------------------------------------------------------------------------
// Função principal — Orquestra o pipeline RAG com Streaming
// ---------------------------------------------------------------------------

/**
 * Executa o pipeline completo de RAG com streaming SSE.
 *
 * Diferente da versão anterior que retornava uma string, esta função
 * recebe o objeto Response do Express e faz o pipe dos tokens diretamente.
 *
 * Fluxo:
 *   1. Vetorizar a pergunta
 *   2. Buscar documentos similares (com threshold)
 *   3. Montar o prompt RAG
 *   4. Fazer streaming da resposta do LLM → SSE → frontend
 *
 * @param pergunta - Pergunta do aluno extraída do body da requisição
 * @param res      - Response do Express (com headers SSE já configurados)
 */
export async function processarPerguntaStream(
  pergunta: string,
  res: Response
): Promise<void> {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`📨 [RAG] Nova pergunta (stream): "${pergunta}"`);
  console.log(`${"─".repeat(50)}`);

  const inicio = Date.now();

  // Etapa 0: Reescrever a pergunta para melhorar a busca semântica
  const perguntaReescrita = await reescreverPergunta(pergunta);

  // Etapa 1: Vetorizar a pergunta REESCRITA (não a original)
  const embedding = await gerarEmbedding(perguntaReescrita);

  // Etapa 2: Busca híbrida (vetorial + FTS) com RRF
  const documentos = await buscarHibrido(embedding, perguntaReescrita);

  // Extrair as fontes dos documentos recuperados para referência
  const fontes = documentos.map(
    (doc) => `${doc.origem} (similaridade: ${doc.similaridade.toFixed(2)})`
  );

  // Etapa 3: Montar mensagens RAG com a PERGUNTA ORIGINAL (não a reescrita)
  // Isso garante que a resposta do LLM soe natural e responda exatamente
  // o que o aluno perguntou, sem a formalização artificial da reescrita.
  const mensagens = montarMensagensRAG(pergunta, documentos);

  console.log(
    `🤖 [RAG] Iniciando streaming com ${documentos.length} documentos de contexto...`
  );

  // Etapa 4: Stream da resposta do LLM diretamente para o frontend
  await streamRespostaOllama(mensagens, res, fontes);

  const duracao = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log(`⏱️  [RAG] Pipeline streaming concluído em ${duracao}s\n`);
}
