import type { Response } from "express";
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
  extractDraftFromThinking,
  generateOllamaEmbedding,
} from "../config/ollama.js";
import { getPositiveExamples, type FewShotExample } from "./feedback.service.js";
import { getMCPClient, getMCPBetaTools } from "./mcp_agent.service.js";
import { logInteraction } from "./analytics.service.js";

/**
 * Serviço do Agente MCP Beta (Otimizado).
 *
 * Melhorias implementadas em relação ao agente baseline:
 *   1. System prompt alinhado (enum ESTAGIO_TCC sincronizado com o Zod).
 *   2. Busca híbrida assimétrica (semantic_query para bge-m3 + keywords para FTS).
 *   3. Re-ranking refinado no MCP Server (códigos de matéria, matriz curricular, penalidades).
 *   4. Injeção de ICL Dinâmico (exemplos com 👍 no Passo 3 de síntese).
 *   5. Forçamento determinístico de chamada da ferramenta fora de saudações.
 *   6. Temperatura 0.0 na síntese para máxima fidelidade normativa.
 *   7. Busca corretiva adaptativa se a primeira consulta não retornar trechos.
 */

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const LLM_MODEL = process.env.OLLAMA_LLM_MODEL || "qwen3.5:4b";
const NUM_CTX = Number(process.env.OLLAMA_NUM_CTX) || 10240;
const FETCH_TIMEOUT_MS = 600000;

/** System Prompt otimizado para o Agente Beta */
const AGENT_BETA_SYSTEM_PROMPT = `Você é o assistente virtual oficial do IFMG Campus Ouro Branco no modo otimizado.

Você tem acesso à ferramenta de busca avançada 'search_ifmg_knowledge_beta'. USE ESTA FERRAMENTA para responder perguntas sobre regulamentos acadêmicos, PPC, matriz curricular, ementas, TCC, estágios, atividades complementares e normas do campus.

REGRAS OBRIGATÓRIAS:
1. SEMPRE use a ferramenta search_ifmg_knowledge_beta antes de responder qualquer dúvida acadêmica ou institucional.
2. Ao gerar os parâmetros para a ferramenta search_ifmg_knowledge_beta:
   - 'semantic_query': Crie uma pergunta contextualizada, formal e completa com siglas expandidas (ex: 'Qual a ementa detalhada e objetivos de Banco de Dados I no curso de Sistemas?').
   - 'keywords': Extraia os termos-chave essenciais, códigos de disciplina (ex: OBBGSIN.034) e nomes próprios para a busca textual (ex: 'ementa Banco de Dados I OBBGSIN.034').
   - 'intent': Classifique estritamente a intenção em UMA destas 10 categorias:
     * INGRESSO_MATRICULA: Vestibular, SISU, transferências, trancamento, renovação de matrícula.
     * ESTRUTURA_CURSOS: Matriz curricular, listagem de disciplinas de um período/semestre (ex: "matérias do 1º período", "grade do 3º semestre"), PPC, duração.
     * DISCIPLINA_EMENTA: Ementa detalhada, pré-requisitos, bibliografia e objetivos de uma disciplina específica.
     * AVALIACAO_FREQUENCIA: Pontuação, média, provas, faltas (25%), abono e atestados.
     * ESTAGIO_TCC: Regras de estágio obrigatório/não obrigatório, documentação, orientadores e bancas de Trabalho de Conclusão de Curso.
     * ATIVIDADES_EXTRAS: Horas complementares (AAC), pesquisa, extensão e monitoria.
     * ASSISTENCIA_BOLSAS: Assistência estudantil, auxílios e bolsas de estudo.
     * INFRA_CAMPUS: Biblioteca, laboratórios, restaurante, horários de funcionamento.
     * DIREITOS_DEVERES: Regime disciplinar, sanções e direitos discentes.
     * OUTRAS: Qualquer outro assunto geral do campus.
3. Use EXCLUSIVAMENTE as informações retornadas pela ferramenta. Não invente ou complemente com conhecimento externo.
4. EMENTAS E NORMAS: Se o usuário solicitar a EMENTA de uma disciplina ou normas específicas, forneça o conteúdo INTEGRAL retornado pela ferramenta, sem resumir ou omitir tópicos. Se a pergunta for apenas para listar disciplinas de um período, cite os nomes das matérias e seus códigos.
5. Se a ferramenta não retornar resultados relevantes, responda: "Não encontrei essa informação nos documentos disponíveis. Recomendo consultar a coordenação do seu curso ou o setor correspondente do IFMG."
6. Cite a fonte (nome do documento) sempre que possível.
7. Para saudações simples (olá, bom dia), responda cordialmente sem usar a ferramenta.

DIRETIVAS DE IDIOMA E FORMATAÇÃO:
- Responda EXCLUSIVAMENTE em Português do Brasil (pt-BR).
- PROIBIDO exibir blocos de raciocínio como 'Thinking Process:' ou 'Analyze the Request:'. Escreva apenas a resposta final diretamente para o aluno.
- Use **negrito** para destacar nomes de disciplinas, códigos e prazos importantes.`;

/** Resposta de chat do Ollama */
interface OllamaChatResponse {
  message?: {
    role: string;
    content: string;
    tool_calls?: Array<{
      function: {
        name: string;
        arguments: Record<string, unknown>;
      };
    }>;
  };
  done?: boolean;
}

/**
 * Infere a intenção por palavras-chave caso necessário para o fallback.
 */
function inferIntentionFromKeywords(text: string): string {
  const t = text.toLowerCase();
  if (/(?:disciplinas?|mat[eé]rias?|grade)\s+(?:do|da|no|na|de)?\s*(?:\d+[oaºª]?\s*)?per[íi]odo/i.test(text)) return "ESTRUTURA_CURSOS";
  if (/matriz|grade\s+curricular|ppc|dura[cç][aã]o\s+do\s+curso/i.test(t)) return "ESTRUTURA_CURSOS";
  if (/ementa|pre-?requisito|conte[uú]do\s+(?:da|programático)/i.test(t)) return "DISCIPLINA_EMENTA";
  if (/per[íi]odo|semestre|curso\s+de/i.test(t)) return "ESTRUTURA_CURSOS";
  if (/disciplina/i.test(t)) return "DISCIPLINA_EMENTA";
  if (/tcc|trabalho\s+de\s+conclus[aã]o|est[aá]gio/i.test(t)) return "ESTAGIO_TCC";
  if (/matr[íi]cula|ingresso|sisu|vestibular|trancamento/i.test(t)) return "INGRESSO_MATRICULA";
  if (/frequ[eê]ncia|falta|nota|abono|atestado|prova|exame/i.test(t)) return "AVALIACAO_FREQUENCIA";
  if (/bolsa|aux[ií]lio|moradia|transporte/i.test(t)) return "ASSISTENCIA_BOLSAS";
  if (/biblioteca|laborat[oó]rio|restaurante/i.test(t)) return "INFRA_CAMPUS";
  if (/disciplinar|penalidade|deveres|direitos/i.test(t)) return "DIREITOS_DEVERES";
  if (/horas?\s+complementar|extens[aã]o|monitoria|pesquisa/i.test(t)) return "ATIVIDADES_EXTRAS";
  return "OUTRAS";
}

/**
 * Executa o pipeline do Agente Beta com Streaming SSE.
 */
export async function processAgentBetaQuestionStream(
  question: string,
  res: Response,
  sessionId?: string
): Promise<void> {
  const start = Date.now();
  console.log(`\n${"─".repeat(50)}`);
  console.log(`🧪 [Agente Beta] Nova pergunta: "${question}"`);
  if (sessionId) console.log(`🧠 [Agente Beta] Sessão: ${sessionId.substring(0, 8)}...`);

  // 1. Verificação de sessão expirada
  if (sessionId && isSessionExpired(sessionId)) {
    console.log(`⏰ [Agente Beta] Sessão expirada: ${sessionId.substring(0, 8)}...`);
    res.write(`data: ${JSON.stringify({ type: "session_expired" })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    return;
  }

  // 2. Recuperar ou criar sessão
  const session = sessionId ? getOrCreateSession(sessionId) : null;
  const contextualizedQuestion = session
    ? resolveReferences(question, session)
    : question;

  res.write(`data: ${JSON.stringify({ type: "status", status: "Analisando pergunta (Modo Beta)..." })}\n\n`);

  // 3. Fast-path de saudação
  if (detectGreetingBypass(contextualizedQuestion)) {
    console.log(`🚀 [Agente Beta] Fast-path ativado: saudação detectada.`);
    res.write(`data: ${JSON.stringify({ type: "status", status: "Preparando resposta..." })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: "sources", sources: [] })}\n\n`);
    await streamStaticGreeting(res);

    if (session) {
      updateSession(session.sessionId, question, "GREETING", STATIC_GREETING_RESPONSE);
    }
    const totalMs = Date.now() - start;
    logInteraction({
      sessionId: session?.sessionId ?? "anonymous",
      mode: "agent_beta",
      question,
      contextualizedQuestion,
      intent: "GREETING",
      response: STATIC_GREETING_RESPONSE,
      totalDurationMs: totalMs,
    }).catch((err) => console.error("Erro ao registrar log Agente Beta (fast-path):", err));

    const duration = (totalMs / 1000).toFixed(1);
    console.log(`⏱️  [Agente Beta] Fast-path concluído em ${duration}s\n`);
    return;
  }

  const mcpClient = getMCPClient();
  if (!mcpClient) {
    throw new Error("Servidor MCP não está conectado.");
  }

  const betaTools = await getMCPBetaTools();

  // Histórico conversacional recente
  const historyMessages = (session?.messages ?? [] as SessionMessage[])
    .slice(-5)
    .map((m: SessionMessage) => ({ role: m.role, content: m.content }));

  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: AGENT_BETA_SYSTEM_PROMPT },
    ...historyMessages,
    { role: "user", content: contextualizedQuestion },
  ];

  // ── Passo 1: Chamada ao LLM para decisão e Tool Calling ──
  console.log(`🧠 [Agente Beta] Passo 1: Avaliando intenção e ferramentas com ${betaTools.length} tool(s)...`);
  res.write(`data: ${JSON.stringify({ type: "status", status: "Analisando intenção e ferramentas..." })}\n\n`);

  const firstResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      tools: betaTools,
      stream: false,
      keep_alive: "24h",
      options: {
        num_ctx: NUM_CTX,
        temperature: 0,
        num_predict: 512,
      },
    }),
  });

  if (!firstResponse.ok) {
    const errorText = await firstResponse.text();
    throw new Error(`[Ollama] Erro ${firstResponse.status}: ${errorText}`);
  }

  const firstData = (await firstResponse.json()) as OllamaChatResponse;
  const assistantMessage = firstData.message;

  if (!assistantMessage) {
    throw new Error("[Ollama] Resposta sem message");
  }

  // ── Forçamento Determinístico de Ferramenta para Perguntas Fatuais/Acadêmicas ──
  // Se o modelo responder diretamente sem ferramentas para uma pergunta não-saudação,
  // injetamos a chamada da ferramenta search_ifmg_knowledge_beta para garantir embasamento factual.
  const isGreetingQuery = /^(ol[áa]|bom\s+dia|boa\s+tarde|boa\s+noite|tudo\s+bem|oi|opa|e\s+a[ií])[\s!?.]*$/i.test(contextualizedQuestion.trim());
  
  if ((!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) && !isGreetingQuery) {
    console.log(`💡 [Agente Beta] Forçando busca determinística para pergunta factual: "${contextualizedQuestion}"`);
    const inferredIntent = inferIntentionFromKeywords(contextualizedQuestion);
    assistantMessage.tool_calls = [
      {
        function: {
          name: "search_ifmg_knowledge_beta",
          arguments: {
            semantic_query: contextualizedQuestion,
            keywords: contextualizedQuestion.replace(/[?.,!;]/g, "").trim(),
            intent: inferredIntent,
          },
        },
      },
    ];
  }

  const sources: string[] = [];
  const executedToolCalls: Array<{ name: string; arguments?: Record<string, unknown> }> = [];
  let detectedIntent: string | undefined = undefined;

  // ── Passo 2: Execução das ferramentas solicitadas ──
  if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    console.log(`🔧 [Agente Beta] Executando ${assistantMessage.tool_calls.length} chamada(s) de ferramenta...`);

    messages.push({
      role: "assistant",
      content: assistantMessage.content || "",
      tool_calls: assistantMessage.tool_calls,
    });

    res.write(`data: ${JSON.stringify({ type: "status", status: "Buscando nos documentos oficiais (Beta)..." })}\n\n`);

    for (const toolCall of assistantMessage.tool_calls) {
      const { name, arguments: args } = toolCall.function;
      executedToolCalls.push({ name, arguments: args });
      if (args && typeof args.intent === "string") {
        detectedIntent = args.intent;
      }
      console.log(`   📞 [Agente Beta] Chamando ferramenta: ${name}(${JSON.stringify(args)})`);

      try {
        let toolResult = await mcpClient.callTool({
          name,
          arguments: args,
        });

        let resultText = (
          toolResult.content as Array<{ type: string; text: string }>
        )
          .filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("\n");

        // ── Passo Corretivo (Corrective RAG) ──
        // Se a busca inicial retornou que nada foi encontrado, tenta uma busca relaxada com a pergunta integral
        if (resultText.includes("Nenhum trecho relevante encontrado") && args.keywords) {
          console.log(`🔄 [Agente Beta] Busca corretiva ativada: ampliando termos de busca...`);
          res.write(`data: ${JSON.stringify({ type: "status", status: "Refinando busca documental..." })}\n\n`);

          const relaxedArgs = {
            semantic_query: contextualizedQuestion,
            keywords: contextualizedQuestion,
            intent: args.intent || inferIntentionFromKeywords(contextualizedQuestion),
          };

          const retryResult = await mcpClient.callTool({
            name,
            arguments: relaxedArgs,
          });

          const retryText = (
            retryResult.content as Array<{ type: string; text: string }>
          )
            .filter((c) => c.type === "text")
            .map((c) => c.text)
            .join("\n");

          if (!retryText.includes("Nenhum trecho relevante encontrado")) {
            console.log(`   ✅ [Agente Beta] Busca corretiva encontrou documentos relevantes!`);
            resultText = retryText;
          }
        }

        console.log(`   ✅ [Agente Beta] Trechos recuperados: ${resultText.substring(0, 80)}...`);

        // Extrai fontes
        const sourcesMatch = resultText.match(/\(fonte: ([^,]+), score RRF/g);
        if (sourcesMatch) {
          sourcesMatch.forEach((f) => {
            const match = f.match(/fonte: ([^,]+)/);
            if (match && !sources.includes(match[1])) sources.push(match[1]);
          });
        }

        messages.push({
          role: "tool",
          tool_name: name,
          content: resultText,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        console.error(`   ❌ [Agente Beta] Erro na ferramenta ${name}: ${msg}`);
        messages.push({
          role: "tool",
          tool_name: name,
          content: `Erro ao buscar documentos: ${msg}`,
        });
      }
    }

    res.write(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`);
  } else {
    // Resposta direta (sem ferramentas)
    console.log("💬 [Agente Beta] Resposta direta gerada pelo modelo");
    const directContent = assistantMessage.content || "Olá! Como posso ajudar você hoje com informações sobre o IFMG?";

    res.write(`data: ${JSON.stringify({ type: "sources", sources: [] })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: "token", content: directContent })}\n\n`);
    res.write(`data: [DONE]\n\n`);

    if (session) {
      updateSession(session.sessionId, question, "", directContent);
    }
    return;
  }

  // ── Etapa ICL Dinâmico: Busca de Exemplos de Sucesso (Few-Shot) ──
  let fewShotBlock = "";
  try {
    const questionEmbedding = await generateOllamaEmbedding(contextualizedQuestion);
    const positiveExamples: FewShotExample[] = await getPositiveExamples(questionEmbedding, 2);

    if (positiveExamples.length > 0) {
      console.log(`🌟 [Agente Beta] ICL Dinâmico: ${positiveExamples.length} exemplo(s) com 👍 injetado(s)`);
      const examplesFormatted = positiveExamples
        .map(
          (ex, i) =>
            `EXEMPLO ${i + 1}:\nPERGUNTA DO ALUNO: ${ex.question}\nSUA RESPOSTA (aprovada com nota máxima): ${ex.response}`
        )
        .join("\n\n");

      fewShotBlock = `\n═══ EXEMPLOS DE SUCESSO APROVADOS PELOS ALUNOS ═══\n${examplesFormatted}\n═══ FIM DOS EXEMPLOS ═══\nUse estes exemplos como referência de tom formal, clareza e estrutura.\n`;
    }
  } catch (error) {
    console.warn("⚠️  [Agente Beta] Falha ao recuperar exemplos de ICL:", error);
  }

  // ── Passo 3: Síntese final com Streaming e Temperatura 0.0 ──
  console.log("🌊 [Agente Beta] Passo 3: Gerando síntese final (temperatura: 0.0)...");
  res.write(`data: ${JSON.stringify({ type: "status", status: "Sintetizando resposta final..." })}\n\n`);

  const messagesFinal = [
    ...messages,
    {
      role: "system",
      content: `DIRETIVA FINAL OBRIGATÓRIA:
${fewShotBlock}
Sua resposta deve basear-se ESTRITAMENTE nos trechos de documentos retornados pela ferramenta acima.
- Responda em Português do Brasil (pt-BR).
- Forneça ementas ou normas de forma INTEGRAL sem resumir.
- NÃO se apresente ou inclua pensamentos internos. Vá direto ao ponto.`,
    },
  ];

  const streamResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: messagesFinal,
      stream: true,
      think: false,
      keep_alive: "1h",
      options: {
        num_ctx: NUM_CTX,
        temperature: 0.0, // Determinação factual máxima
        num_predict: 2048,
      },
    }),
  });

  if (!streamResponse.ok) {
    const errorText = await streamResponse.text();
    throw new Error(`[Ollama Síntese] Erro ${streamResponse.status}: ${errorText}`);
  }

  if (!streamResponse.body) {
    throw new Error("[Ollama Stream] Corpo da resposta vazio");
  }

  // Lê o stream NDJSON e faz pipe para SSE
  const reader = streamResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let fullThought = "";
  let generatedTokens = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const chunk = JSON.parse(trimmed) as {
            message?: { content?: string; thinking?: string; reasoning_content?: string };
            done?: boolean;
          };

          // 1. Canal de raciocínio / thinking
          const thoughtToken = chunk.message?.thinking || chunk.message?.reasoning_content;
          if (thoughtToken) {
            fullThought += thoughtToken;
            res.write(`data: ${JSON.stringify({ type: "thought", content: thoughtToken })}\n\n`);
          }

          // 2. Envia apenas o conteúdo final da resposta
          const textToken = chunk.message?.content;
          if (textToken) {
            if (textToken.trim() === "<think>" || textToken.trim() === "</think>") continue;
            generatedTokens = true;
            fullText += textToken;
            res.write(
              `data: ${JSON.stringify({ type: "token", content: textToken })}\n\n`
            );
          }

          if (chunk.done) {
            console.log("🤖 [Agente Beta] Geração concluída pelo Ollama");
          }
        } catch {
          // Ignora linhas não-JSON
        }
      }
    }

    // Processa resto do buffer
    if (buffer.trim()) {
      try {
        const chunk = JSON.parse(buffer.trim()) as {
          message?: { content?: string; thinking?: string; reasoning_content?: string };
        };
        const thoughtToken = chunk.message?.thinking || chunk.message?.reasoning_content;
        if (thoughtToken) {
          fullThought += thoughtToken;
          res.write(`data: ${JSON.stringify({ type: "thought", content: thoughtToken })}\n\n`);
        }

        const textToken = chunk.message?.content;
        if (textToken && textToken.trim() !== "<think>" && textToken.trim() !== "</think>") {
          generatedTokens = true;
          fullText += textToken;
          res.write(
            `data: ${JSON.stringify({ type: "token", content: textToken })}\n\n`
          );
        }
      } catch {
        // Ignora
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Se nenhum token de conteúdo foi gerado, mas houve pensamento
  if (!generatedTokens) {
    const extractedResponse = extractDraftFromThinking(fullThought);

    if (extractedResponse) {
      console.log("💡 [Agente Beta] Extraindo resposta rascunhada do canal de thinking...");
      generatedTokens = true;
      fullText = extractedResponse;
      res.write(`data: ${JSON.stringify({ type: "token", content: extractedResponse })}\n\n`);
    } else {
      console.warn("⚠️ [Agente Beta] Resposta vazia no streaming. Enviando fallback.");
      const fallbackMsg = "Não encontrei essa informação nos documentos disponíveis. Recomendo consultar a coordenação do curso ou acessar o portal do IFMG.";
      res.write(
        `data: ${JSON.stringify({ type: "token", content: fallbackMsg })}\n\n`
      );
    }
  }

  // Sinaliza fim do stream
  res.write(`data: [DONE]\n\n`);

  // Atualiza memória
  if (session && fullText) {
    updateSession(session.sessionId, question, "", fullText);
  }

  const totalMs = Date.now() - start;
  const duration = (totalMs / 1000).toFixed(1);

  logInteraction({
    sessionId: session?.sessionId ?? "anonymous",
    mode: "agent_beta",
    question,
    contextualizedQuestion,
    intent: detectedIntent,
    toolCalls: executedToolCalls,
    sources,
    response: fullText,
    totalDurationMs: totalMs,
  }).catch((err) => console.error("Erro ao registrar log Agente Beta:", err));

  console.log(`⏱️  [Agente Beta] Pipeline concluído com sucesso em ${duration}s\n`);
}
