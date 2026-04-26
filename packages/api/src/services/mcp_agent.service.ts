import type { Response } from "express";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

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
const LLM_MODEL = process.env.OLLAMA_LLM_MODEL || "qwen3.5:latest";

/** System Prompt do agente — instrui o LLM a usar ferramentas */
const AGENT_SYSTEM_PROMPT = `Você é o chatIFme, assistente virtual oficial do curso de Sistemas de Informação do IFMG Campus Ouro Branco.

Você tem acesso a uma ferramenta de busca nos documentos oficiais do curso. USE ESTA FERRAMENTA para responder perguntas sobre:
- Regulamentos acadêmicos
- PPC (Projeto Pedagógico do Curso)
- Grade curricular e carga horária
- TCC, estágio, atividades complementares
- Normas do campus e informações institucionais

REGRAS OBRIGATÓRIAS:
1. SEMPRE use a ferramenta search_ifmg_knowledge antes de responder perguntas sobre o curso.
2. Use EXCLUSIVAMENTE as informações retornadas pela ferramenta.
3. NÃO invente, suponha ou complemente com conhecimento externo.
4. Se a ferramenta não retornar resultados relevantes, diga: "Não encontrei essa informação nos documentos disponíveis. Recomendo consultar a coordenação do curso."
5. Cite a fonte (nome do documento) quando possível.
6. Responda sempre em português brasileiro, de forma educada e organizada.
7. Para saudações simples (olá, bom dia), responda diretamente sem usar a ferramenta.`;

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
export async function inicializarMCPClient(): Promise<void> {
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
export async function encerrarMCPClient(): Promise<void> {
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
 * Fluxo:
 *   1. Envia pergunta ao Ollama com tools[] (stream: false)
 *   2. Se Ollama retorna tool_calls → executa via MCP callTool
 *   3. Reenvia resultado da ferramenta ao Ollama (stream: true)
 *   4. Faz pipe dos tokens para o frontend via SSE
 *
 * @param pergunta - Pergunta do aluno
 * @param res      - Response do Express (com headers SSE)
 */
export async function processarPerguntaAgente(
  pergunta: string,
  res: Response
): Promise<void> {
  if (!mcpClient) {
    throw new Error("[Agente] MCP Client não inicializado");
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`🤖 [Agente] Nova pergunta: "${pergunta}"`);
  console.log(`${"─".repeat(50)}`);

  const inicio = Date.now();

  // Monta as mensagens iniciais
  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: AGENT_SYSTEM_PROMPT },
    { role: "user", content: pergunta },
  ];

  // ── Passo 1: Primeira chamada ao Ollama (com tools, sem streaming) ──
  console.log(
    `🧠 [Agente] Passo 1: Enviando ao Ollama com ${ollamaTools.length} ferramenta(s)...`
  );

  const firstResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      tools: ollamaTools,
      stream: false,
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
    const fontes: string[] = [];

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
        const fontesMatch = resultText.match(
          /\(fonte: ([^,]+), similaridade/g
        );
        if (fontesMatch) {
          fontesMatch.forEach((f) => {
            const match = f.match(/fonte: ([^,]+)/);
            if (match) fontes.push(match[1]);
          });
        }

        // Adiciona o resultado da ferramenta ao histórico
        messages.push({
          role: "tool",
          content: resultText,
        });
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Erro desconhecido";
        console.error(`   ❌ [Agente] Erro ao executar ${name}: ${msg}`);

        messages.push({
          role: "tool",
          content: `Erro ao buscar documentos: ${msg}`,
        });
      }
    }

    // Envia as fontes como primeiro evento SSE
    res.write(`data: ${JSON.stringify({ type: "fontes", fontes })}\n\n`);
  } else {
    // Sem tool_calls — resposta direta (ex: saudações)
    console.log(
      "💬 [Agente] Passo 2: Sem tool_calls — resposta direta"
    );

    // Adiciona a mensagem do assistente ao histórico
    messages.push({
      role: "assistant",
      content: assistantMessage.content || "",
    });

    // Envia fontes vazias
    res.write(
      `data: ${JSON.stringify({ type: "fontes", fontes: [] })}\n\n`
    );

    // Se já tem conteúdo na resposta direta, envia como tokens
    if (assistantMessage.content) {
      res.write(
        `data: ${JSON.stringify({ type: "token", content: assistantMessage.content })}\n\n`
      );
      res.write(`data: [DONE]\n\n`);

      const duracao = ((Date.now() - inicio) / 1000).toFixed(1);
      console.log(
        `⏱️  [Agente] Pipeline concluído em ${duracao}s (sem ferramentas)\n`
      );
      return;
    }
  }

  // ── Passo 3: Segunda chamada ao Ollama com streaming ──
  console.log("🌊 [Agente] Passo 3: Gerando resposta final com streaming...");

  const streamResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      stream: true,
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

  // Sinaliza fim do stream
  res.write(`data: [DONE]\n\n`);

  const duracao = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log(`⏱️  [Agente] Pipeline streaming concluído em ${duracao}s\n`);
}
