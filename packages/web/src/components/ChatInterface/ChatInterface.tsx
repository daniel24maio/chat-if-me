import React, { useState, useEffect } from 'react';
import './ChatInterface.styles.css';
import logoImage from '../../assets/ifmg-logo.jpeg';
import { callOllamaApi } from '../../services/api/ollamaApi';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const ChatInterface: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! Bem-vindo ao chatIFme. Como posso ajudar?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Nota: A lógica de "resposta em português" baseada no prompt foi substituída
  // pela chamada direta à API Ollama, mas mantém um fallback de erro.

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // 1. Adiciona mensagem do usuário
    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue('');
    setIsTyping(true);

    // 2. Simula delay de rede (opcional, mas bom para UX)
    setTimeout(async () => {
      try {
        // 3. CHAMADA REAL DA API
        const aiResponse = await callOllamaApi(inputValue);

        // 4. Adiciona resposta da IA
        const newAiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: aiResponse,
          sender: 'ai',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newAiMessage]);
      } catch (error) {
        // Fallback de erro caso a API Ollama esteja indisponível
        console.error('Erro na chamada Ollama:', error);
        const fallbackMessage =
          'Desculpe, estou tendo dificuldades para conectar com o servidor da IA agora.';
        const errorAiMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: fallbackMessage,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorAiMessage]);
      } finally {
        setIsTyping(false);
      }
    }, 1000); // Mantém o delay para dar sensação de processamento
  };

  return (
    <div className="chat-interface">
      {/* Cabeçalho */}
      <header className="chat-header">
        <div className="logo-container">
            <img src={logoImage} alt="Logo IFMG" className="logo-img" />
            <h1>Chat IFMG me </h1>
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
            </div>
            <span className="message-time">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        
        {isTyping && (
          <div className="message ai-message typing-indicator">
            <div className="message-content">Buscando informação...</div>
          </div>
        )}
      </div>

      {/* Área de Input */}
      <footer className="chat-footer">
        <form onSubmit={handleSendMessage} className="input-form">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Digite sua dúvida..."
            className="input-field"
          />
          <button type="submit" className="submit-btn">
            Enviar
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatInterface;