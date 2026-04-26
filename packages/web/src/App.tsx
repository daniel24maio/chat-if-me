import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatInterface from './components/ChatInterface/ChatInterface';
import EmbeddingPage from './pages/EmbeddingPage/EmbeddingPage';

/**
 * Componente raiz da aplicação.
 *
 * Rotas:
 *   / — Interface do chat (assistente virtual)
 *   /embedding — Painel de administração para upload de documentos
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatInterface />} />
        <Route path="/embedding" element={<EmbeddingPage />} />
      </Routes>
    </BrowserRouter>
  );
}