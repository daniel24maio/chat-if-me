import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ChatInterface.styles.css';
import logoImage from '../../assets/logo-ifmg.png';
import ThemeToggle from '../ThemeToggle/ThemeToggle';

/**
 * URL base da API backend.
 * Em produção, configurar via variável de ambiente do Vite (VITE_API_URL).
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  /** Fontes dos documentos que embasaram a resposta (apenas mensagens da IA) */
  fontes?: string[];
  /** Indica se a mensagem está sendo gerada por streaming */
  isStreaming?: boolean;
}

/**
 * Interface principal do chat com streaming SSE.
 *
 * O frontend envia a pergunta via POST para a API, que responde com
 * Server-Sent Events (SSE). Cada token da resposta é exibido em tempo real,
 * dando a sensação de que a IA está "digitando".
 */
const ChatInterface: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! 👋 Bem-vindo ao chatIFme — assistente virtual do campus IFMG Ouro Branco.',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  /** Modo agente (MCP) ou RAG clássico */
  const [useAgent, setUseAgent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  /** Ref para abortar o stream se o usuário enviar outra pergunta */
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll suave para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Processa o stream SSE da API usando fetch + ReadableStream.
   *
   * Eventos esperados do backend:
   *   data: {"type":"fontes","fontes":[...]}   → fontes dos documentos
   *   data: {"type":"token","content":"..."}    → token da resposta
   *   data: {"type":"erro","mensagem":"..."}    → erro durante o stream
   *   data: [DONE]                              → fim do stream
   */
  const processarStream = useCallback(async (pergunta: string, aiMessageId: string) => {
    // Cria AbortController para permitir cancelamento
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const endpoint = useAgent ? '/api/agent' : '/api/chat';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta }),
        signal: controller.signal,
      });

      // Se a resposta não for SSE (ex: erro de validação), trata como JSON
      if (!response.ok || !response.headers.get('content-type')?.includes('text/event-stream')) {
        const errorData = await response.json().catch(() => ({ erro: 'Erro desconhecido' }));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId
              ? { ...m, text: `⚠️ ${errorData.erro || 'Erro ao processar pergunta.'}`, isStreaming: false }
              : m
          )
        );
        setIsStreaming(false);
        return;
      }

      // Lê o stream usando a API nativa ReadableStream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('ReadableStream não suportado neste navegador');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Processa cada linha do buffer (protocolo SSE: "data: ...")
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();

          // Linhas SSE começam com "data: "
          if (!trimmed.startsWith('data: ')) continue;

          const payload = trimmed.slice(6); // Remove "data: "

          // Sinal de fim do stream
          if (payload === '[DONE]') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMessageId ? { ...m, isStreaming: false } : m
              )
            );
            setIsStreaming(false);
            return;
          }

          // Parse do evento JSON
          try {
            const event = JSON.parse(payload) as {
              type: string;
              content?: string;
              fontes?: string[];
              mensagem?: string;
            };

            if (event.type === 'token' && event.content) {
              // Acumula token no texto da mensagem (atualização progressiva)
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId
                    ? { ...m, text: m.text + event.content }
                    : m
                )
              );
            } else if (event.type === 'fontes' && event.fontes) {
              // Armazena as fontes na mensagem
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId ? { ...m, fontes: event.fontes } : m
                )
              );
            } else if (event.type === 'erro') {
              // Erro enviado pelo backend durante o stream
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId
                    ? {
                        ...m,
                        text: `⚠️ ${event.mensagem || 'Erro durante a geração.'}`,
                        isStreaming: false,
                      }
                    : m
                )
              );
              setIsStreaming(false);
              return;
            }
          } catch {
            // Ignora linhas não-JSON
          }
        }
      }

      // Se o stream terminou sem [DONE] (conexão cortada)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId ? { ...m, isStreaming: false } : m
        )
      );
      setIsStreaming(false);
    } catch (error) {
      // Tratamento de erros de rede / abort
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[Stream] Requisição cancelada pelo usuário');
        return;
      }

      console.error('[Stream] Erro:', error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId
            ? {
                ...m,
                text: '⚠️ Não foi possível conectar ao servidor. Verifique se a API está rodando.',
                isStreaming: false,
              }
            : m
        )
      );
      setIsStreaming(false);
    } finally {
      abortControllerRef.current = null;
    }
  }, [useAgent]);

  /**
   * Envia a mensagem do usuário e inicia o stream da resposta.
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;

    const currentInput = inputValue.trim();

    // Cancela qualquer stream anterior em andamento
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 1. Adiciona mensagem do usuário
    const userMsgId = Date.now().toString();
    const newUserMessage: Message = {
      id: userMsgId,
      text: currentInput,
      sender: 'user',
      timestamp: new Date(),
    };

    // 2. Cria placeholder da mensagem da IA (texto vazio, será preenchido pelo stream)
    const aiMsgId = (Date.now() + 1).toString();
    const aiPlaceholder: Message = {
      id: aiMsgId,
      text: '',
      sender: 'ai',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, newUserMessage, aiPlaceholder]);
    setInputValue('');
    setIsStreaming(true);

    // 3. Inicia o stream
    processarStream(currentInput, aiMsgId);
  };

  return (
    <div className="chat-interface">
      {/* Cabeçalho com identidade visual IFMG Campus Ouro Branco */}
      <header className="chat-header">
        <div className="logo-container">
          <img src={logoImage} alt="Logo IFMG Campus Ouro Branco" className="logo-img" />
          <div className="header-text">
            <h1>chatIFme</h1>
            <span className="campus-badge">Campus Ouro Branco — Sistemas de Informação</span>
          </div>
        </div>
        {/* Controles do header: toggle modo + toggle tema */}
        <div className="header-controls">
          <button
            className={`mode-toggle ${useAgent ? 'mode-agent' : 'mode-rag'}`}
            onClick={() => setUseAgent((prev) => !prev)}
            disabled={isStreaming}
            title={useAgent ? 'Modo: Agente MCP (Tool Calling)' : 'Modo: RAG Clássico'}
          >
            {useAgent ? '🤖 Agente' : '📚 RAG'}
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Área de Mensagens */}
      <div className="messages-area">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.sender === 'user' ? 'user-message' : 'ai-message'}`}
          >
            <div className="message-content">
              {msg.text}
              {/* Cursor piscando durante o streaming */}
              {msg.isStreaming && <span className="streaming-cursor">▊</span>}
            </div>

            {/* Exibe fontes dos documentos quando disponíveis */}
            {msg.fontes && msg.fontes.length > 0 && !msg.isStreaming && (
              <div className="message-fontes">
                <span className="fontes-label">📚 Fontes:</span>
                {msg.fontes.map((fonte, i) => (
                  <span key={i} className="fonte-tag">{fonte}</span>
                ))}
              </div>
            )}

            <span className="message-time">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {/* Indicador de busca (antes do streaming começar) */}
        {isStreaming && messages[messages.length - 1]?.text === '' && (
          <div className="searching-indicator">
            <span className="searching-dot" />
            <span className="searching-dot" />
            <span className="searching-dot" />
            <span className="searching-text">Buscando nos documentos...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Área de Input */}
      <footer className="chat-footer">
        <form onSubmit={handleSendMessage} className="input-form">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isStreaming ? 'Aguarde a resposta...' : 'Digite sua dúvida...'}
            className="input-field"
            disabled={isStreaming}
          />
          <button
            type="submit"
            className="submit-btn"
            disabled={isStreaming || !inputValue.trim()}
          >
            {isStreaming ? '⏳' : 'Enviar'}
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatInterface;