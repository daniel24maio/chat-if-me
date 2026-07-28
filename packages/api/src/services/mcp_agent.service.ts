import type { Response } from "express";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
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
import { streamOllamaResponse, type OllamaChatMessage } from "../config/ollama.js";

/**
 * Serviço do Agente MCP — Agentic RAG.
 *
 * Orquestra o fluxo de Tool Calling:
 *   1. Conecta ao MCP Server (subprocesso via stdio)
 *   2. Descobre as ferramentas disponíveis (listTools)
 *   3. Envia a pergunta ao Ollama COM as ferramentas
 *   4. Se o Ollama pedir tool_calls, executa via MCP (callTool)
 *   5. Reenvia o resultado ao Ollama para gerar a resposta final (streaming SSE)
 */

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const LLM_MODEL = process.env.OLLAMA_LLM_MODEL || "qwen3.5:4b";

/** Context window máximo por requisição (economia de VRAM) */
const NUM_CTX = Number(process.env.OLLAMA_NUM_CTX) || 8192;

/** Timeout global de segurança para as chamadas do Ollama (10 minutos) */
const FETCH_TIMEOUT_MS = 600000;

/** System Prompt do agente — instrui o LLM a usar ferramentas e formatar corretamente */
const AGENT_SYSTEM_PROMPT = `Você é o assistente virtual oficial do IFMG Campus Ouro Branco.

Você tem acesso a uma ferramenta de busca nos documentos oficiais (cursos, PPC, regulamentos, portarias, ementas). USE ESTA FERRAMENTA para responder perguntas sobre regulamentos acadêmicos, PPC, grade curricular, TCC, estágio, atividades complementares e normas gerais do campus.

REGRAS OBRIGATÓRIAS:
1. SEMPRE use a ferramenta search_ifmg_knowledge antes de responder perguntas acadêmicas ou sobre normas do campus.
2. Ao gerar o parâmetro 'query' na ferramenta de busca:
   - Extraia APENAS palavras-chave principais e nomes próprios (proibido usar frases completas, pronomes ou conectivos).
   - SEMPRE EXPANDA SIGLAS acadêmicas (ex: TCC -> Trabalho de Conclusão de Curso, PPC -> Projeto Pedagógico do Curso, AC -> Atividades Complementares, IRA -> Índice de Rendimento Acadêmico).
3. Ao gerar o parâmetro 'intent', classifique a intenção estritamente em uma destas 10 categorias:
   - INGRESSO_MATRICULA: Vestibular, SISU, transferências, trancamento, renovação de matrícula.
   - ESTRUTURA_CURSOS: Matriz curricular, PPC, duração de cursos, regras gerais dos cursos do campus.
   - DISCIPLINA_EMENTA: Carga horária específica, pré-requisitos, conteúdo programático, ementas, bibliografia.
   - AVALIACAO_FREQUENCIA: Pontuação, provas, aprovação, limite de faltas (25%), abono/atestados.
   - TCC: Regras, documentação, orientadores e bancas de Trabalho de Conclusão de Curso.
   - ATIVIDADES_EXTRAS: Horas complementares (AAC), pesquisa, extensão, monitoria.
   - ASSISTENCIA_BOLSAS: Assistência estudantil, auxílios (moradia, transporte), bolsas de estudo.
   - INFRA_CAMPUS: Biblioteca, laboratórios, restaurante, horários de funcionamento, setores administrativos.
   - DIREITOS_DEVERES: Regime disciplinar, deveres dos alunos, penalidades, direitos discentes.
   - OUTRAS: Para qualquer outro assunto acadêmico ou geral.
4. Use EXCLUSIVAMENTE as informações retornadas pela ferramenta. Não invente ou complemente com conhecimento externo.
5. FILTRE ESTRITAMENTE: Extraia APENAS a informação pontual que responde à pergunta do usuário. É EXPRESSAMENTE PROIBIDO gerar longos blocos de texto, ementas completas ou eixos curriculares se a pergunta for apenas sobre listar matérias ou verificar carga horária.
6. Se a ferramenta não retornar resultados relevantes, diga: "Não encontrei essa informação nos documentos disponíveis. Recomendo consultar a coordenação do seu curso ou o setor correspondente do IFMG."
7. Cite a fonte (nome do documento) quando possível.
8. Para saudações simples (olá, bom dia), responda diretamente sem usar a ferramenta.

DIRETIVAS DE IDIOMA E FORMATAÇÃO:
- REGRA ABSOLUTA: Responda EXCLUSIVAMENTE em Português do Brasil (pt-BR).
- ECONOMIA DE TOKENS: Seja extremamente direto e conciso. Não enrole na introdução ou conclusão.
- FORMATAÇÃO SIMPLES: Use bullet points ('* ') APENAS no nível principal. NUNCA crie listas aninhadas ou recuos secundários.
- Use **negrito** para destacar os termos principais (Ex: nomes das matérias).`;

// ---------------------------------------------------------------------------
// MCP Client — Conexão com o servidor
// ---------------------------------------------------------------------------

let mcpClient: Client | null = null;
let ollamaTools: OllamaToolDef[] = [];

/** Formato de ferramenta esperado pela API do Ollama */
interface OllamaToolDef {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

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
 * Inicializa o MCP Client — conecta ao MCP Server como subprocesso.
 * Chamada uma vez na subida do servidor Express.
 */
export async function initializeMCPClient(): Promise<void> {
  try {
    // Resolve o caminho para o MCP Server compilado
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const mcpServerPath = resolve(
      __dirname,
      "..",
      "..",
      "mcp-server",
      "dist",
      "index.js"
    );

    console.log(`🔌 [MCP Client] Conectando ao servidor: ${mcpServerPath}`);

    // Cria o transporte stdio — o MCP Server roda como subprocesso
    const transport = new StdioClientTransport({
      command: "node",
      args: [mcpServerPath],
      env: {
        ...process.env,
        // Propaga variáveis de ambiente para o subprocesso
        DATABASE_URL: process.env.DATABASE_URL || "",
        OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || "",
        OLLAMA_EMBED_MODEL: process.env.OLLAMA_EMBED_MODEL || "",
      },
    });

    // Inicializa o client MCP
    mcpClient = new Client(
      { name: "chatifme-agent", version: "1.0.0" },
      { capabilities: {} }
    );

    await mcpClient.connect(transport);
    console.log("✅ [MCP Client] Conectado ao servidor MCP");

    // Descobre as ferramentas disponíveis
    const { tools } = await mcpClient.listTools();
    console.log(
      `🔧 [MCP Client] ${tools.length} ferramenta(s) disponível(is):`
    );
    tools.forEach((t) => console.log(`   • ${t.name}: ${t.description}`));

    // Converte para o formato Ollama tools[]
    ollamaTools = tools.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description || "",
        parameters: tool.inputSchema as Record<string, unknown>,
      },
    }));
  } catch (error) {
    console.error("❌ [MCP Client] Falha ao conectar:", error);
    throw error;
  }
}

/**
 * Encerra o MCP Client (cleanup na saída do servidor).
 */
export async function closeMCPClient(): Promise<void> {
  if (mcpClient) {
    await mcpClient.close();
    console.log("🔌 [MCP Client] Desconectado");
  }
}

// ---------------------------------------------------------------------------
// Fluxo de Tool Calling com Ollama
// ---------------------------------------------------------------------------

/**
 * Executa o pipeline Agentic RAG com streaming SSE.
 *
 * Diferente da versão anterior que retornava uma string, esta função
 * recebe o objeto Response do Express e faz o pipe dos tokens diretamente.
 *
 * Fluxo:
 *   1. Envia pergunta ao Ollama com tools[] (stream: false)
 *   2. Se Ollama retorna tool_calls → executa via MCP callTool
 *   3. Reenvia resultado da ferramenta ao Ollama (stream: true)
 *   4. Faz pipe dos tokens para o frontend via SSE
 *
 * @param question - Pergunta do aluno
 * @param res      - Response do Express (com headers SSE)
 */
export async function processAgentQuestion(
  question: string,
  res: Response,
  sessionId?: string
): Promise<void> {
  if (!mcpClient) {
    throw new Error("[Agente] MCP Client não inicializado");
  }

  const dataHora = new Date().toLocaleString("pt-BR");
  console.log(`\n${"─".repeat(50)}`);
  console.log(`🤖 [Agente] Nova pergunta: "${question}"`);
  console.log(`📅 [Agente] Data/Hora: ${dataHora}`);
  if (sessionId) console.log(`🧠 [Agente] Sessão: ${sessionId.substring(0, 8)}...`);
  console.log(`${"─".repeat(50)}`);

  // ── Verificação de sessão expirada ──
  if (sessionId && isSessionExpired(sessionId)) {
    console.log(`⏰ [Agente] Sessão expirada: ${sessionId.substring(0, 8)}...`);
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

  const start = Date.now();

  res.write(`data: ${JSON.stringify({ type: "status", status: "Analisando pergunta..." })}\n\n`);

  // 1. Verificação local fast-path para saudações
  if (detectGreetingBypass(contextualizedQuestion)) {
    console.log(`🚀 [Agente] Fast-path ativado: saudação detectada localmente.`);
    res.write(`data: ${JSON.stringify({ type: "status", status: "Preparando resposta..." })}\n\n`);

    await streamStaticGreeting(res);

    if (session) {
      updateSession(session.sessionId, question, "GREETING", STATIC_GREETING_RESPONSE);
    }

    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`⏱️  [Agente] Fast-path concluído em ${duration}s (sem busca/ferramentas)\n`);
    return;
  }

  // Histórico das últimas 5 mensagens da sessão (contexto conversacional)
  const historyMessages: Array<Record<string, unknown>> = (session?.messages ?? [] as SessionMessage[])
    .slice(-5)
    .map((m: SessionMessage) => ({ role: m.role, content: m.content }));

  // Monta as mensagens iniciais
  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: AGENT_SYSTEM_PROMPT },
    ...historyMessages,
    { role: "user", content: contextualizedQuestion },
  ];

  // ── Passo 1: Primeira chamada ao Ollama (com tools, sem streaming) ──
  console.log(
    `🧠 [Agente] Passo 1: Enviando ao Ollama com ${ollamaTools.length} ferramenta(s)...`
  );

  res.write(`data: ${JSON.stringify({ type: "status", status: "Analisando intenção..." })}\n\n`);

  const firstResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      tools: ollamaTools,
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

  // ── Passo 2: Verificar se há tool_calls ──
  if (
    assistantMessage.tool_calls &&
    assistantMessage.tool_calls.length > 0
  ) {
    console.log(
      `🔧 [Agente] Passo 2: Ollama solicitou ${assistantMessage.tool_calls.length} chamada(s) de ferramenta`
    );

    // Adiciona a mensagem do assistente com os tool_calls ao histórico
    messages.push({
      role: "assistant",
      content: assistantMessage.content || "",
      tool_calls: assistantMessage.tool_calls,
    });

    // Executa cada tool call via MCP
    const sources: string[] = [];

    res.write(`data: ${JSON.stringify({ type: "status", status: "Buscando nos documentos..." })}\n\n`);

    for (const toolCall of assistantMessage.tool_calls) {
      const { name, arguments: args } = toolCall.function;
      console.log(
        `   📞 [Agente] Chamando ferramenta: ${name}(${JSON.stringify(args)})`
      );

      try {
        const toolResult = await mcpClient.callTool({
          name,
          arguments: args,
        });

        // Extrai o texto do resultado MCP
        const resultText = (
          toolResult.content as Array<{ type: string; text: string }>
        )
          .filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("\n");

        console.log(
          `   ✅ [Agente] Resultado: ${resultText.substring(0, 80)}...`
        );

        // Extrai fontes do resultado para exibir no frontend
        const sourcesMatch = resultText.match(
          /\(fonte: ([^,]+), similaridade/g
        );
        if (sourcesMatch) {
          sourcesMatch.forEach((f) => {
            const match = f.match(/fonte: ([^,]+)/);
            if (match) sources.push(match[1]);
          });
        }

        // Adiciona o resultado da ferramenta ao histórico
        messages.push({
          role: "tool",
          tool_name: name,
          content: resultText,
        });
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Erro desconhecido";
        console.error(`   ❌ [Agente] Erro ao executar ${name}: ${msg}`);

        messages.push({
          role: "tool",
          tool_name: name,
          content: `Erro ao buscar documentos: ${msg}`,
        });
      }
    }

    // Envia as fontes como primeiro evento SSE
    res.write(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`);
  } else {
    // Sem tool_calls — resposta direta (ex: saudações)
    console.log("💬 [Agente] Passo 2: Sem tool_calls — resposta direta");

    // Se não retornou tool_calls E não retornou texto, o modelo falhou em gerar saída útil
    if (!assistantMessage.content) {
      console.warn("⚠️ [Agente] O modelo não retornou tools nem texto no Passo 1. Abortando.");
      const fallbackMsg = "Desculpe, não consegui processar a sua pergunta neste momento. Pode tentar reformular?";
      res.write(`data: ${JSON.stringify({ type: "status", status: "Erro de geração..." })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: "sources", sources: [] })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: "token", content: fallbackMsg })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      if (session) {
        updateSession(session.sessionId, question, "", fallbackMsg);
      }
      return;
    }

    res.write(`data: ${JSON.stringify({ type: "status", status: "Preparando resposta..." })}\n\n`);

    // Adiciona a mensagem do assistente ao histórico
    messages.push({
      role: "assistant",
      content: assistantMessage.content,
    });

    // Envia fontes vazias
    res.write(
      `data: ${JSON.stringify({ type: "sources", sources: [] })}\n\n`
    );

    res.write(
      `data: ${JSON.stringify({ type: "token", content: assistantMessage.content })}\n\n`
    );
    res.write(`data: [DONE]\n\n`);

    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log(
      `⏱️  [Agente] Pipeline concluído em ${duration}s (sem ferramentas)\n`
    );

    // Atualizar memória com a resposta direta
    if (session) {
      updateSession(session.sessionId, question, "", assistantMessage.content);
    }

    return;
  }

  // ── Passo 3: Segunda chamada ao Ollama com streaming ──
  console.log("🌊 [Agente] Passo 3: Gerando resposta final com streaming...");

  // Adiciona um lembrete de diretivas no final do histórico para evitar que modelos menores esqueçam as regras de idioma e síntese
  const messagesFinal = [
    ...messages,
    {
      role: "system",
      content: "DIRETIVA FINAL OBRIGATÓRIA: Sua resposta deve ser baseada EXCLUSIVAMENTE nos trechos de documentos retornados pela ferramenta acima. NÃO se apresente, NÃO liste suas capacidades. Responda diretamente a pergunta do usuário usando os dados dos documentos. Responda em Português do Brasil (pt-BR). Ignore trechos de outras disciplinas não relacionadas à pergunta.",
    }
  ];

  const streamResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: messagesFinal,
      stream: true,
      keep_alive: "1h",
      options: {
        num_ctx: NUM_CTX,
        temperature: 0.2,
        num_predict: 768,
      },
    }),
  });

  if (!streamResponse.ok) {
    const errorText = await streamResponse.text();
    throw new Error(
      `[Ollama Stream] Erro ${streamResponse.status}: ${errorText}`
    );
  }

  if (!streamResponse.body) {
    throw new Error("[Ollama Stream] Corpo da resposta vazio");
  }

  // Lê o stream NDJSON e faz pipe para SSE
  const reader = streamResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
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
          const chunk = JSON.parse(trimmed) as OllamaChatResponse;

          if (chunk.message?.content) {
            generatedTokens = true;
            fullText += chunk.message.content;
            res.write(
              `data: ${JSON.stringify({ type: "token", content: chunk.message.content })}\n\n`
            );
          }

          if (chunk.done) {
            console.log("🤖 [Agente] Geração concluída pelo Ollama");
          }
        } catch {
          // Ignora linhas não-JSON
        }
      }
    }

    // Processa resto do buffer
    if (buffer.trim()) {
      try {
        const chunk = JSON.parse(buffer.trim()) as OllamaChatResponse;
        if (chunk.message?.content) {
          generatedTokens = true;
          fullText += chunk.message.content;
          res.write(
            `data: ${JSON.stringify({ type: "token", content: chunk.message.content })}\n\n`
          );
        }
      } catch {
        // Ignora
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Se nenhum token foi gerado, envia um fallback amigável
  if (!generatedTokens) {
    console.warn("⚠️ [Agente] Resposta vazia no streaming. Enviando fallback.");
    const fallbackMsg = "Não encontrei essa informação nos documentos disponíveis. Recomendo consultar a coordenação do curso ou acessar o portal do IFMG.";
    res.write(
      `data: ${JSON.stringify({ type: "token", content: fallbackMsg })}\n\n`
    );
  }

  // Sinaliza fim do stream
  res.write(`data: [DONE]\n\n`);

  const duration = ((Date.now() - start) / 1000).toFixed(1);

  // ── Atualizar memória da sessão ──
  if (session) {
    updateSession(session.sessionId, question, "", fullText);
  }

  console.log(`⏱️  [Agente] Pipeline streaming concluído em ${duration}s\n`);
}
