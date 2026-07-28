import type { Response } from "express";
import type { RetrievedDocument } from "../interfaces/chat.interfaces.js";
import { pool } from "../config/database.js";
import {
  generateOllamaEmbedding,
  streamOllamaResponse,
  rewriteWithLLM,
  type OllamaChatMessage,
} from "../config/ollama.js";
import {
  isSessionExpired,
  getOrCreateSession,
  updateSession,
  resolveReferences,
  type SessionMessage,
} from "./memory.service.js";
import {
  detectGreetingBypass,
  streamStaticGreeting,
  STATIC_GREETING_RESPONSE,
} from "./fast_path.util.js";
import {
  getPositiveExamples,
  countNegativesByChunk,
  PENALTY_BETA,
  type FewShotExample,
} from "./feedback.service.js";

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
// Etapa 0 — Query Rewriting (Reescrita de Pergunta)
// ---------------------------------------------------------------------------

/**
 * System Prompt para o LLM de reescrita.
 *
 * Contém o dicionário de siglas acadêmicas do IFMG e regras para
 * formalizar a linguagem sem alterar o sentido da pergunta.
 */
const REWRITE_SYSTEM_PROMPT = `Você é um assistente de pré-processamento de consultas para um sistema de busca de documentos acadêmicos do IFMG (Instituto Federal de Gerais), Campus Ouro Branco.

Sua tarefa: reescrever a pergunta do usuário para melhorar a busca semântica em documentos acadêmicos.

REGRAS:
1. Classifique a intenção da pergunta e inicie a resposta com uma Tag de Intenção:
   - [CURSO]: Dúvidas sobre o projeto pedagógico, regras gerais, estágios, TCC.
   - [DISCIPLINA]: Dúvidas sobre nomes de matérias, códigos, carga horária, pré-requisitos.
   - [CONTEUDO]: Dúvidas específicas sobre a ementa ou tópicos ensinados dentro de uma disciplina.
   - [GREETING]: Cumprimentos, saudações gerais (ex: "Olá", "bom dia") ou perguntas gerais sobre quem é o assistente/o que ele faz.
   - [OUTRAS]: Dúvidas administrativas, infraestrutura do campus, portarias, calendário.
2. Expanda TODAS as siglas acadêmicas:
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
3. Transforme linguagem coloquial em linguagem formal/acadêmica.
4. Adicione contexto implícito quando cabível (ex: "reprovar" → "critérios de reprovação").
5. Mantenha o sentido original da pergunta.
6. Responda APENAS com a Tag de Intenção seguida da pergunta reescrita, sem aspas. Exemplo: "[DISCIPLINA] qual é a carga horária de cálculo 1?"`;

/**
 * Reescreve a pergunta do aluno para melhorar a qualidade da busca semântica.
 *
 * Usa um LLM leve (qwen3.5) para expandir siglas e formalizar a linguagem,
 * produzindo um texto que se alinha melhor com o vocabulário dos documentos
 * oficiais do IFMG armazenados no pgvector.
 *
 * Fallback: se a reescrita falhar (ex: Ollama offline), usa a pergunta original.
 *
 * @param question - Pergunta original do aluno
 * @returns Pergunta reescrita e expandida
 */
async function rewriteQuestion(question: string): Promise<{ intention: string; rewrittenQuestion: string }> {
  try {
    console.log(`✍️  [Reescrita] Original: "${question}"`);

    const rewritten = await rewriteWithLLM(REWRITE_SYSTEM_PROMPT, question);

    // Validação: se a reescrita ficou vazia ou absurdamente longa, usa a original
    if (!rewritten || rewritten.length > 1000) {
      console.log(`✍️  [Reescrita] Resultado inválido, usando original.`);
      return { intention: "OUTRAS", rewrittenQuestion: question };
    }

    const match = rewritten.trim().match(/^\[(.*?)\]\s*(.*)/);
    if (match) {
      const intention = match[1].toUpperCase();
      const rewrittenQuestion = match[2];
      console.log(`✍️  [Reescrita] Intenção: [${intention}] | Reescrita: "${rewrittenQuestion}"`);
      return { intention, rewrittenQuestion };
    }

    console.log(`✍️  [Reescrita] Resultado sem tag: "${rewritten}"`);
    return { intention: "OUTRAS", rewrittenQuestion: rewritten };
  } catch (error) {
    // Fallback gracioso: se a reescrita falhar, não bloqueia o pipeline
    console.warn(
      `⚠️  [Reescrita] Falha na reescrita, usando pergunta original:`,
      error instanceof Error ? error.message : error
    );
    return { intention: "OUTRAS", rewrittenQuestion: question };
  }
}

// ---------------------------------------------------------------------------
// Etapa 1 — Vetorização (Embeddings)
// ---------------------------------------------------------------------------

/**
 * Converte o texto da pergunta em um vetor numérico (embedding).
 * Utiliza o modelo configurado no Ollama (ex: bge-m3, 1024 dimensões).
 *
 * @param text - Texto a ser vetorizado (pergunta do aluno)
 * @returns Vetor numérico representando o texto no espaço semântico
 */
async function generateEmbedding(text: string): Promise<number[]> {
  console.log(`🔢 [RAG] Vetorizando pergunta: "${text.substring(0, 60)}..."`);

  const embedding = await generateOllamaEmbedding(text);

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
 * @param queryText  - Texto da pergunta (para Full-Text Search)
 * @param limit      - Número máximo de resultados (default: 5)
 */
async function hybridSearch(
  embedding: number[],
  queryText: string,
  limit: number = 8
): Promise<RetrievedDocument[]> {
  console.log(
    `🔍 [RAG] Busca híbrida: vetorial (α=${RRF_ALPHA}) + FTS (1-α=${1 - RRF_ALPHA}), k=${RRF_K}`
  );

  const vectorStr = `[${embedding.join(",")}]`;

  const result = await pool.query(
    `WITH
       semantic AS (
         SELECT id, content AS content, metadata->>'filename' AS source,
           1 - (embedding <=> $1::vector) AS similarity,
           ROW_NUMBER() OVER (ORDER BY embedding <=> $1::vector) AS rank
         FROM documents
         ORDER BY embedding <=> $1::vector
         LIMIT 20
       ),
       lexical AS (
         SELECT id, content AS content, metadata->>'filename' AS source,
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
       COALESCE(s.content, l.content) AS content,
       COALESCE(s.source, l.source) AS source,
       COALESCE(s.similarity, 0) AS similarity,
       (
         ${RRF_ALPHA} * COALESCE(1.0 / (${RRF_K} + s.rank), 0.0) +
         ${1 - RRF_ALPHA} * COALESCE(1.0 / (${RRF_K} + l.rank), 0.0)
       ) AS rrf_score
     FROM semantic s
     FULL OUTER JOIN lexical l ON s.id = l.id
     ORDER BY rrf_score DESC
     LIMIT $3`,
    [vectorStr, queryText, limit]
  );

  let documents: RetrievedDocument[] = result.rows.map((row) => ({
    id: Number(row.id),
    content: row.content,
    source: row.source || "documento desconhecido",
    similarity: Number(row.rrf_score),
  }));

  // ── Penalização por feedback negativo (ICL Dinâmico) ──
  // Chunks com feedbacks negativos acumulados têm o score RRF reduzido:
  //   Score_final = Score_RRF × 1 / (1 + β × N_negativos)
  if (documents.length > 0) {
    const chunkIds = documents.map((d) => d.id);
    const negatives = await countNegativesByChunk(chunkIds);

    if (negatives.size > 0) {
      for (const doc of documents) {
        const negCount = negatives.get(doc.id) || 0;
        if (negCount > 0) {
          const originalScore = doc.similarity;
          doc.similarity *= 1 / (1 + PENALTY_BETA * negCount);
          console.log(
            `⚠️  [RRF] Chunk #${doc.id} penalizado: ` +
            `${negCount} negativo(s), score ${originalScore.toFixed(4)} → ${doc.similarity.toFixed(4)}`
          );
        }
      }

      // Re-ordenar após penalização
      documents.sort((a, b) => b.similarity - a.similarity);
      documents = documents.slice(0, limit);
    }
  }

  if (documents.length === 0) {
    console.log(`🔍 [RAG] Nenhum documento encontrado (vetorial + FTS).`);
  } else {
    console.log(`🔍 [RAG] ${documents.length} documentos (RRF híbrido):`);
    documents.forEach((doc, i) => {
      console.log(
        `   ${i + 1}. [RRF: ${doc.similarity.toFixed(4)}] ${doc.source}: "${doc.content.substring(0, 50)}..."`
      );
    });
  }

  return documents;
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
function buildRAGMessages(
  question: string,
  documents: RetrievedDocument[],
  intention: string,
  fewShotExamples: FewShotExample[] = [],
  sessionMessages: SessionMessage[] = []
): OllamaChatMessage[] {
  // Monta o contexto a partir dos documentos recuperados
  const context =
    documents.length > 0
      ? documents
        .map(
          (doc, i) =>
            `--- Trecho ${i + 1} (fonte: ${doc.source}, similaridade: ${doc.similarity.toFixed(2)}) ---\n${doc.content}`
        )
        .join("\n\n")
      : "Nenhum documento relevante foi encontrado na base de conhecimento.";

  // ── Bloco Few-Shot (ICL Dinâmico) ──
  // Injeta exemplos de interações anteriores avaliadas positivamente (👍)
  // para guiar o tom e formato da resposta do LLM em tempo real.
  let fewShotBlock = "";
  if (fewShotExamples.length > 0) {
    const examples = fewShotExamples
      .map(
        (ex, i) =>
          `EXEMPLO ${i + 1}:\nPERGUNTA DO ALUNO: ${ex.question}\nSUA RESPOSTA (aprovada pelo usuário): ${ex.response}`
      )
      .join("\n\n");

    fewShotBlock = `\n═══ EXEMPLOS DE SUCESSO (interações anteriores avaliadas positivamente pelos usuários) ═══\n${examples}\n═══ FIM DOS EXEMPLOS ═══\n\nUse os exemplos acima como REFERÊNCIA DE TOM E FORMATO. Adapte o conteúdo ao CONTEXTO abaixo.\n`;
  }

  // System Prompt RAG rigoroso contra alucinações e com diretivas de formatação
  const systemPrompt = `Você é o assistente virtual oficial do IFMG Campus Ouro Branco.

Sua função é responder dúvidas dos alunos sobre regulamentos, PPC (Projeto Pedagógico do Curso), grade curricular, normas acadêmicas e informações do campus.

INTENÇÃO DA PERGUNTA: [${intention}] (Foque a sua resposta no contexto dessa intenção).
${fewShotBlock}
CONTEXTO (trechos dos documentos oficiais do curso):
${context}

REGRAS OBRIGATÓRIAS (siga rigorosamente):
1. Use EXCLUSIVAMENTE as informações do CONTEXTO acima.
2. NÃO invente, suponha ou complemente com conhecimento externo.
3. Se a resposta não estiver nos trechos, diga: "Não encontrei essa informação nos documentos disponíveis. Recomendo consultar a coordenação do curso ou acessar o portal do IFMG."
4. Cite a fonte (nome do documento) quando possível.

DIRETIVAS OBRIGATÓRIAS DE IDIOMA E FORMATAÇÃO:
- REGRA ABSOLUTA: Responda EXCLUSIVAMENTE em Português do Brasil (pt-BR). Traduza qualquer termo do contexto que esteja em inglês. É proibido responder em inglês ou qualquer outro idioma.
- REGRA PROIBITIVA: NUNCA exiba blocos de raciocínio como 'Thinking Process:', 'Analyze the Request:', 'Scan Context' ou passos internos de análise. Escreva APENAS a resposta final diretamente para o aluno.
- Seja DIRETO E CONCISO. Não copie longos trechos de texto (como ementas completas ou bibliografias) a menos que o usuário tenha solicitado especificamente.
- Se a intenção for [DISCIPLINA] e o usuário pedir uma lista de disciplinas de um período, cite APENAS os nomes das disciplinas e seus códigos.
- Mantenha a formatação simples. Use listas ('* ') com UM ÚNICO NÍVEL de aninhamento. NUNCA coloque listas dentro de listas.
- Use **negrito** para destacar nomes de disciplinas, códigos ou termos chaves.
- Finalize com uma pergunta breve e proativa (Ex: "Gostaria que eu detalhasse a ementa de alguma dessas disciplinas?").`;

  // Histórico das últimas 5 mensagens da sessão (contexto conversacional)
  const historyMessages: OllamaChatMessage[] = sessionMessages
    .slice(-5)
    .map((m) => ({ role: m.role, content: m.content }));

  return [
    { role: "system", content: systemPrompt },
    ...historyMessages,
    { role: "user", content: question },
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
 * @param question - Pergunta do aluno extraída do body da requisição
 * @param res      - Response do Express (com headers SSE já configurados)
 */
export async function processQuestionStream(
  question: string,
  res: Response,
  sessionId?: string
): Promise<void> {
  const dataHora = new Date().toLocaleString("pt-BR");
  console.log(`\n${"─".repeat(50)}`);
  console.log(`📅 [RAG] Data/Hora: ${dataHora}`);
  console.log(`📨 [RAG] Nova pergunta (stream): "${question}"`);
  if (sessionId) console.log(`🧠 [RAG] Sessão: ${sessionId.substring(0, 8)}...`);
  console.log(`${"─".repeat(50)}`);

  // ── Verificação de sessão expirada ──
  if (sessionId && isSessionExpired(sessionId)) {
    console.log(`⏰ [RAG] Sessão expirada: ${sessionId.substring(0, 8)}...`);
    res.write(`data: ${JSON.stringify({ type: "session_expired" })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    return;
  }

  // ── Recuperar ou criar sessão ──
  const session = sessionId ? getOrCreateSession(sessionId) : null;

  // ── Resolver referências anafóricas usando a memória ──
  const contextualizedQuestion = session
    ? resolveReferences(question, session)
    : question;

  res.write(`data: ${JSON.stringify({ type: "status", status: "Analisando pergunta..." })}\n\n`);

  const start = Date.now();

  // 1. Verificação local fast-path para saudações
  if (detectGreetingBypass(contextualizedQuestion)) {
    console.log(`🚀 [RAG] Fast-path ativado: saudação detectada localmente.`);
    res.write(`data: ${JSON.stringify({ type: "status", status: "Preparando resposta..." })}\n\n`);

    const t3 = Date.now();
    await streamStaticGreeting(res);
    const generationMs = Date.now() - t3;
    const totalMs = Date.now() - start;

    res.write(`data: ${JSON.stringify({ type: "metrics", timings: { rewrite: 0, embedding: 0, retrieval: 0, generation: generationMs, total: totalMs } })}\n\n`);

    if (session) {
      updateSession(session.sessionId, question, "GREETING", STATIC_GREETING_RESPONSE);
    }

    console.log(`⏱️  [RAG] Fast-path concluído em ${(totalMs / 1000).toFixed(1)}s (sem busca)\n`);
    return;
  }

  // Etapa 0: Reescrever a pergunta (com pronomes já resolvidos) para melhorar a busca semântica
  const t0 = Date.now();
  const { intention, rewrittenQuestion } = await rewriteQuestion(contextualizedQuestion);
  const rewriteMs = Date.now() - t0;

  // 2. Verificação pós-reescrita para saudações classificadas pelo LLM
  if (intention === "GREETING") {
    console.log(`🚀 [RAG] Fast-path ativado: reescrevedor classificou como GREETING.`);
    res.write(`data: ${JSON.stringify({ type: "status", status: "Preparando resposta..." })}\n\n`);

    const t3 = Date.now();
    await streamStaticGreeting(res);
    const generationMs = Date.now() - t3;
    const totalMs = Date.now() - start;

    res.write(`data: ${JSON.stringify({ type: "metrics", timings: { rewrite: rewriteMs, embedding: 0, retrieval: 0, generation: generationMs, total: totalMs } })}\n\n`);

    if (session) {
      updateSession(session.sessionId, question, "GREETING", STATIC_GREETING_RESPONSE);
    }

    console.log(`⏱️  [RAG] Fast-path LLM concluído em ${(totalMs / 1000).toFixed(1)}s (sem busca)\n`);
    return;
  }

  res.write(`data: ${JSON.stringify({ type: "status", status: "Buscando nos documentos..." })}\n\n`);

  // Etapa 1: Vetorizar a pergunta REESCRITA (não a original)
  const t1 = Date.now();
  const embedding = await generateEmbedding(rewrittenQuestion);
  const embedMs = Date.now() - t1;

  // Etapa 2: Busca híbrida (vetorial + FTS) com RRF + penalização por feedback negativo
  const t2 = Date.now();
  const documents = await hybridSearch(embedding, rewrittenQuestion);
  const retrievalMs = Date.now() - t2;

  // Extrair as fontes dos documentos recuperados para referência
  const sources = documents.map(
    (doc) => `${doc.source} (similaridade: ${doc.similarity.toFixed(2)})`
  );

  // ── Etapa 2.5: ICL Dinâmico — Busca de exemplos few-shot positivos ──
  // Busca interações anteriores avaliadas com 👍 que sejam similares à
  // pergunta atual (cosseno > 0.85) para injeção como exemplos no prompt.
  let fewShotExamples: FewShotExample[] = [];
  try {
    fewShotExamples = await getPositiveExamples(embedding);
    if (fewShotExamples.length > 0) {
      console.log(`✨ [ICL] ${fewShotExamples.length} exemplo(s) positivo(s) encontrado(s)! Injetando few-shot...`);
      fewShotExamples.forEach((ex, i) => {
        console.log(`   ${i + 1}. [sim: ${ex.similarity.toFixed(4)}] "${ex.question.substring(0, 60)}..."`);
      });
    }
  } catch (error) {
    // Falha silenciosa: pipeline continua sem few-shot
    console.warn(`⚠️  [ICL] Erro na busca few-shot, continuando sem exemplos:`, error instanceof Error ? error.message : error);
  }

  // Etapa 3: Montar mensagens RAG com a PERGUNTA ORIGINAL (não a reescrita),
  // a intenção e os exemplos few-shot (se encontrados).
  // Isso garante que a resposta do LLM soe natural e responda exatamente
  // o que o aluno perguntou, sem a formalização artificial da reescrita.
  const messages = buildRAGMessages(question, documents, intention, fewShotExamples, session?.messages ?? []);

  console.log(
    `🤖 [RAG] Iniciar streaming com ${documents.length} documentos de contexto...`
  );

  // Etapa 4: Stream da resposta do LLM diretamente para o frontend
  const t3 = Date.now();
  const fullResponse = await streamOllamaResponse(messages, res, sources);
  const generationMs = Date.now() - t3;

  const totalMs = Date.now() - start;

  // Envia métricas de timing como evento SSE antes do fim
  const timings = {
    rewrite: rewriteMs,
    embedding: embedMs,
    retrieval: retrievalMs,
    generation: generationMs,
    total: totalMs,
  };

  res.write(`data: ${JSON.stringify({ type: "metrics", timings })}\n\n`);

  // ── Atualizar memória da sessão ──
  if (session) {
    updateSession(session.sessionId, question, intention, fullResponse);
    session.lastDocuments = documents;
  }

  console.log(
    `⏱️  [RAG] Pipeline concluído em ${(totalMs / 1000).toFixed(1)}s ` +
    `(rewrite: ${rewriteMs}ms, embed: ${embedMs}ms, retrieval: ${retrievalMs}ms, gen: ${generationMs}ms)\n`
  );
}
