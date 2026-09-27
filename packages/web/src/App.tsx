import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import ChatInterface from './components/ChatInterface/ChatInterface';
import EmbeddingPage from './pages/EmbeddingPage/EmbeddingPage';
import StatisticsPage from './pages/StatisticsPage/StatisticsPage';

/**
 * Componente raiz da aplicação.
 *
 * Rotas:
 *   / — Interface do chat (assistente virtual)
 *   /assistente-beta — Interface do chat com modo Agente Beta
 *   /embedding — Painel de administração para upload de documentos
 *   /estatisticas — Painel de métricas e observabilidade
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
          <Route path="/assistente-beta" element={<ChatInterface isBeta={true} />} />
          <Route path="/embedding" element={<EmbeddingPage />} />
          <Route path="/estatisticas" element={<StatisticsPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}