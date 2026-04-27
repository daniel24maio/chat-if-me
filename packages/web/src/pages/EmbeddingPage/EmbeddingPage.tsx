import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import logoImage from '../../assets/logo-ifmg.png';
import './EmbeddingPage.styles.css';

/**
 * URL base da API backend.
 * Em produção, configurar via variável de ambiente do Vite (VITE_API_URL).
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

/** Status possíveis de um arquivo na fila de upload */
type FileStatus = 'aguardando' | 'enviando' | 'processando' | 'concluido' | 'erro';

/** Arquivo na fila de upload com seu status */
interface FileItem {
  id: string;
  file: File;
  status: FileStatus;
  progresso: number;
  mensagem?: string;
  chunks?: number;
}

/** Documento já processado no banco */
interface DocumentoProcessado {
  filename: string;
  totalChunks: number;
  ultimaAtualizacao: string;
}

/**
 * Página de administração para ingestão de documentos.
 *
 * Funcionalidades:
 *   - Upload via drag-and-drop ou seleção de arquivo
 *   - Fila de processamento com barra de progresso
 *   - Lista de documentos já processados no banco
 */
const EmbeddingPage: React.FC = () => {
  const [arquivos, setArquivos] = useState<FileItem[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoProcessado[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega documentos já processados ao montar o componente
  useEffect(() => {
    carregarDocumentos();
  }, []);

  /** Busca a lista de documentos já processados no backend */
  async function carregarDocumentos() {
    try {
      const response = await fetch(`${API_URL}/api/embedding/documentos`);
      if (response.ok) {
        const data = await response.json();
        setDocumentos(data.documentos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    }
  }

  /** Remove um documento da base de conhecimento */
  async function handleDeleteDocument(filename: string) {
    if (!window.confirm(`Tem certeza que deseja excluir o documento '${filename}' e todos os seus chunks?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/embedding/documentos/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove da lista local imediatamente para melhor UX
        setDocumentos((prev) => prev.filter((doc) => doc.filename !== filename));
      } else {
        const data = await response.json();
        alert(data.erro || 'Erro ao excluir o documento.');
      }
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      alert('Falha na conexão ao tentar excluir o documento.');
    }
  }

  /** Adiciona arquivo(s) à fila e inicia o upload */
  const adicionarArquivos = useCallback((files: FileList | File[]) => {
    const novosArquivos: FileItem[] = Array.from(files)
      .filter((f) => f.name.match(/\.(pdf|docx?|xlsx?|csv|txt|jpe?g|png)$/i) || f.type === 'application/pdf')
      .map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        status: 'aguardando' as FileStatus,
        progresso: 0,
      }));

    if (novosArquivos.length === 0) {
      alert('Por favor, selecione apenas arquivos suportados (PDF, Imagens, Word, Excel, CSV, TXT).');
      return;
    }

    setArquivos((prev) => [...prev, ...novosArquivos]);

    // Inicia o upload de cada arquivo
    novosArquivos.forEach((item) => enviarArquivo(item));
  }, []);

  /** Envia um arquivo para a API e acompanha o progresso */
  async function enviarArquivo(item: FileItem) {
    // Atualiza status para "enviando"
    atualizarArquivo(item.id, { status: 'enviando', progresso: 10 });

    const formData = new FormData();
    formData.append('arquivo', item.file);

    try {
      atualizarArquivo(item.id, { status: 'processando', progresso: 30 });

      const response = await fetch(`${API_URL}/api/embedding/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        atualizarArquivo(item.id, {
          status: 'concluido',
          progresso: 100,
          mensagem: `${data.chunksGravados}/${data.totalChunks} chunks processados`,
          chunks: data.chunksGravados,
        });
        // Recarrega lista de documentos
        carregarDocumentos();
      } else {
        atualizarArquivo(item.id, {
          status: 'erro',
          progresso: 100,
          mensagem: data.erro || 'Erro desconhecido',
        });
      }
    } catch (error) {
      atualizarArquivo(item.id, {
        status: 'erro',
        progresso: 100,
        mensagem: 'Falha na conexão com o servidor.',
      });
    }
  }

  /** Atualiza um arquivo na lista pelo ID */
  function atualizarArquivo(id: string, updates: Partial<FileItem>) {
    setArquivos((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  }

  // ---------------------------------------------------------------------------
  // Handlers de Drag & Drop
  // ---------------------------------------------------------------------------

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      adicionarArquivos(e.dataTransfer.files);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      adicionarArquivos(e.target.files);
      // Limpa o input para permitir reselecionar o mesmo arquivo
      e.target.value = '';
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers de renderização
  // ---------------------------------------------------------------------------

  function statusLabel(status: FileStatus): string {
    const labels: Record<FileStatus, string> = {
      aguardando: '⏳ Aguardando...',
      enviando: '📤 Enviando...',
      processando: '⚙️ Processando chunks e embeddings...',
      concluido: '✅ Concluído',
      erro: '❌ Erro',
    };
    return labels[status];
  }

  function statusClass(status: FileStatus): string {
    if (status === 'concluido') return 'success';
    if (status === 'erro') return 'error';
    return '';
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="embedding-page">
      {/* Header com identidade IFMG */}
      <header className="embedding-header">
        <div className="embedding-header-left">
          <img src={logoImage} alt="Logo IFMG Campus Ouro Branco" className="logo-img" />
          <div className="embedding-header-text">
            <h1>chatIFme</h1>
            <span className="admin-badge">Administração — Ingestão de Documentos</span>
          </div>
        </div>
        <Link to="/" className="back-link">
          ← Voltar ao Chat
        </Link>
      </header>

      <main className="embedding-content">
        {/* Upload Zone */}
        <section className="upload-card">
          <h2>📄 Upload de Documentos</h2>
          <div
            className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="dropzone-icon">📁</span>
            <p className="dropzone-text">
              Arraste e solte documentos aqui ou{' '}
              <strong>clique para selecionar</strong>
            </p>
            <p className="dropzone-hint">
              Suporta PDF, Imagens, Word, Excel, CSV e TXT • Máximo 20 MB por arquivo
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.jpg,.jpeg,.png,application/pdf,image/*"
              multiple
              onChange={handleFileSelect}
            />
          </div>
        </section>

        {/* Fila de uploads */}
        <section className="files-card">
          <h2>📋 Fila de Processamento</h2>
          <div className="files-list">
            {arquivos.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">📭</span>
                <p>Nenhum arquivo na fila. Faça o upload de um PDF acima.</p>
              </div>
            ) : (
              arquivos.map((item) => (
                <div key={item.id} className="file-item">
                  <span className="file-icon">📄</span>
                  <div className="file-info">
                    <div className="file-name">{item.file.name}</div>
                    <div className={`file-status ${statusClass(item.status)}`}>
                      {statusLabel(item.status)}
                      {item.mensagem && ` — ${item.mensagem}`}
                    </div>
                    {item.status !== 'concluido' && item.status !== 'erro' && (
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar"
                          style={{ width: `${item.progresso}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Documentos já processados no banco */}
        <section className="docs-card">
          <h2>🗄️ Documentos na Base de Conhecimento</h2>
          {documentos.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">📚</span>
              <p>Nenhum documento processado ainda.</p>
            </div>
          ) : (
            documentos.map((doc, i) => (
              <div key={i} className="doc-item">
                <div className="doc-info">
                  <span className="doc-name">📄 {doc.filename}</span>
                  <span className="doc-chunks">{doc.totalChunks} chunks</span>
                </div>
                <button
                  className="delete-doc-btn"
                  onClick={() => handleDeleteDocument(doc.filename)}
                  title="Excluir documento e seus chunks"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default EmbeddingPage;
