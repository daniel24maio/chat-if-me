import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MarkdownRenderer.styles.css';

interface MarkdownRendererProps {
  /** Conteúdo Markdown cru a ser renderizado */
  content: string;
}

/**
 * Componente de renderização de Markdown para mensagens da IA.
 *
 * Converte Markdown (headings, bold, listas, tabelas GFM, código)
 * em HTML semântico estilizado com a identidade visual do IFMG.
 *
 * Plugins:
 *   - remark-gfm: suporte a tabelas, strikethrough, listas de tarefas
 */
export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
