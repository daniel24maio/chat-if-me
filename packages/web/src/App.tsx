import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import ChatInterface from './components/ChatInterface/ChatInterface';
import EmbeddingPage from './pages/EmbeddingPage/EmbeddingPage';

/**
 * Componente raiz da aplicação.
 *
 * Rotas:
 *   / — Interface do chat (assistente virtual)
 *   /embedding — Painel de administração para upload de documentos
 *
 * O ThemeProvider envolve toda a árvore, permitindo que qualquer
 * componente acesse e alterne o tema via useTheme().
 */
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ChatInterface />} />
          <Route path="/embedding" element={<EmbeddingPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}