// src/services/api/ollamaApi.ts

const OLLAMA_BASE_URL = "http://192.168.31.50:11434";
const MODEL_NAME = "qwen2.5:latest";

interface ChatRequest {
  prompt: string;
}

export interface OllamaResponse {
  response: string;
  done: boolean;
}

/**
 * Função para gerar resposta via API do Ollama
 * Retornar um Promise com a string da resposta do LLM.
 */
export async function callOllamaApi(prompt: string): Promise<string> {
  const url = `${OLLAMA_BASE_URL}/api/generate`;
  
  const payload = {
    model: MODEL_NAME,
    prompt: prompt,
    stream: false // Simplificado para leitura direta do texto
    // Se quiser streaming, use stream: true e consume a resposta incrementalmente
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Fallback para mensagem de erro caso o modelo não esteja carregado
      const errorText = await response.text();
      throw new Error(`Erro na API do Ollama: ${errorText}`);
    }

    const data = await response.json();
    return data.response || data.message?.content || "";

  } catch (error) {
    console.error("Erro ao conectar com o LLM:", error);
    throw new Error("Falha ao conectar com a IA.");
  }
}