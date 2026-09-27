import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BarChart3,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Cpu,
  Download,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Layers,
  BookOpen,
  Filter,
} from 'lucide-react';
import logoLight from '../../assets/logo-ifmg.png';
import logoDark from '../../assets/logo-ifmg-dark-mode.png';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';
import './StatisticsPage.styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

interface OverviewMetrics {
  totalInteractions: number;
  byMode: {
    rag: number;
    agent: number;
    agent_beta: number;
  };
  latency: {
    overallAvgMs: number;
    ragAvgMs: number;
    agentAvgMs: number;
    betaAvgMs: number;
  };
  feedback: {
    up: number;
    down: number;
    unrated: number;
    satisfactionRate: number;
  };
  intentsDistribution: Array<{ intent: string; count: number }>;
  topSources: Array<{ source: string; count: number }>;
}

interface InteractionItem {
  id: number;
  session_id: string;
  mode: 'rag' | 'agent' | 'agent_beta';
  question: string;
  contextualized_question?: string;
  intent?: string;
  sources?: string[];
  tool_calls?: Array<{ name: string; arguments?: Record<string, unknown> }>;
  response: string;
  timings?: {
    rewrite_ms?: number;
    embedding_ms?: number;
    retrieval_ms?: number;
    generation_ms?: number;
    total_ms?: number;
  };
  total_duration_ms: number;
  feedback?: 'up' | 'down' | null;
  created_at: string;
}

export default function StatisticsPage() {
  const { theme } = useTheme();

  // Filtros
  const [quickDate, setQuickDate] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [intentFilter, setIntentFilter] = useState<string>('all');
  const [feedbackFilter, setFeedbackFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dados
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [interactions, setInteractions] = useState<InteractionItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(false);

  // Modal de Detalhes
  const [selectedInteraction, setSelectedInteraction] = useState<InteractionItem | null>(null);

  // Define as datas ao alternar os botões rápidos
  const applyQuickDate = useCallback((type: 'today' | '7d' | '30d' | 'all') => {
    setQuickDate(type);
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().slice(0, 10);

    if (type === 'today') {
      const todayStr = formatDate(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === '7d') {
      const past7 = new Date();
      past7.setDate(today.getDate() - 7);
      setStartDate(formatDate(past7));
      setEndDate(formatDate(today));
    } else if (type === '30d') {
      const past30 = new Date();
      past30.setDate(today.getDate() - 30);
      setStartDate(formatDate(past30));
      setEndDate(formatDate(today));
    } else {
      setStartDate('');
      setEndDate('');
    }
    setPage(1);
  }, []);

  // Inicializa com 7 dias
  useEffect(() => {
    applyQuickDate('7d');
  }, [applyQuickDate]);

  // Carrega Overview e Histórico
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.set('startDate', startDate);
      if (endDate) queryParams.set('endDate', endDate);
      if (modeFilter !== 'all') queryParams.set('mode', modeFilter);
      if (intentFilter !== 'all') queryParams.set('intent', intentFilter);
      if (feedbackFilter !== 'all') queryParams.set('feedback', feedbackFilter);
      if (searchQuery.trim()) queryParams.set('search', searchQuery.trim());

      // 1. Carregar Overview
      const resOverview = await fetch(`${API_URL}/api/stats/overview?${queryParams.toString()}`);
      if (resOverview.ok) {
        const data = await resOverview.json();
        setOverview(data);
      }

      // 2. Carregar Histórico
      queryParams.set('page', String(page));
      queryParams.set('limit', String(limit));

      const resHistory = await fetch(`${API_URL}/api/stats/history?${queryParams.toString()}`);
      if (resHistory.ok) {
        const histData = await resHistory.json();
        setInteractions(histData.interactions || []);
        setTotalRecords(histData.total || 0);
        setTotalPages(histData.totalPages || 1);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, modeFilter, intentFilter, feedbackFilter, searchQuery, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Exportar CSV
  function handleExportCSV() {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.set('startDate', startDate);
    if (endDate) queryParams.set('endDate', endDate);
    if (modeFilter !== 'all') queryParams.set('mode', modeFilter);
    if (intentFilter !== 'all') queryParams.set('intent', intentFilter);
    if (feedbackFilter !== 'all') queryParams.set('feedback', feedbackFilter);
    if (searchQuery.trim()) queryParams.set('search', searchQuery.trim());

    window.open(`${API_URL}/api/stats/export?${queryParams.toString()}`, '_blank');
  }

  // Helpers de formatação
  function formatLatency(ms: number) {
    if (!ms || ms === 0) return '0 ms';
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
    return `${Math.round(ms)}ms`;
  }

  function getLatencyBadgeClass(ms: number) {
    if (ms < 3000) return 'latency-fast';
    if (ms < 8000) return 'latency-medium';
    return 'latency-slow';
  }

  function getModeLabel(mode: string) {
    switch (mode) {
      case 'rag':
        return { label: 'RAG Clássico', cls: 'tag-rag' };
      case 'agent':
        return { label: 'Agente MCP Baseline', cls: 'tag-agent' };
      case 'agent_beta':
        return { label: 'Agente Beta', cls: 'tag-beta' };
      default:
        return { label: mode, cls: '' };
    }
  }

  return (
    <div className="stats-container">
      {/* Header */}
      <header className="stats-header">
        <div className="stats-header-left">
          <img
            src={theme === 'dark' ? logoDark : logoLight}
            alt="Logo IFMG"
            className="stats-logo-img"
          />
          <div className="stats-header-titles">
            <h1>Painel de Métricas e Observabilidade</h1>
            <div className="stats-header-tagline">
              Estatísticas de Latência, Avaliações e Histórico de Interações (TCC)
            </div>
          </div>
        </div>
        <div className="stats-header-right">
          <Link to="/" className="stats-back-link">
            ← Voltar ao Chat
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Barra de Filtros */}
      <section className="stats-filter-card">
        <div className="stats-filter-row">
          {/* Quick Date Presets */}
          <div className="stats-quick-dates">
            <button
              className={`stats-quick-btn ${quickDate === 'today' ? 'active' : ''}`}
              onClick={() => applyQuickDate('today')}
            >
              Hoje
            </button>
            <button
              className={`stats-quick-btn ${quickDate === '7d' ? 'active' : ''}`}
              onClick={() => applyQuickDate('7d')}
            >
              7 dias
            </button>
            <button
              className={`stats-quick-btn ${quickDate === '30d' ? 'active' : ''}`}
              onClick={() => applyQuickDate('30d')}
            >
              30 dias
            </button>
            <button
              className={`stats-quick-btn ${quickDate === 'all' ? 'active' : ''}`}
              onClick={() => applyQuickDate('all')}
            >
              Tudo
            </button>
          </div>

          {/* Custom Date Range */}
          <div className="stats-date-group">
            <input
              type="date"
              className="stats-date-input"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setQuickDate('all');
                setPage(1);
              }}
            />
            <span>até</span>
            <input
              type="date"
              className="stats-date-input"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setQuickDate('all');
                setPage(1);
              }}
            />
          </div>

          {/* Modo */}
          <select
            className="stats-select"
            value={modeFilter}
            onChange={(e) => {
              setModeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Todos os Modos</option>
            <option value="rag">📚 RAG Clássico</option>
            <option value="agent">🤖 Agente MCP Baseline</option>
            <option value="agent_beta">🚀 Agente Beta</option>
          </select>

          {/* Intenção */}
          <select
            className="stats-select"
            value={intentFilter}
            onChange={(e) => {
              setIntentFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Todas as Intenções</option>
            <option value="ESTRUTURA_CURSOS">ESTRUTURA_CURSOS</option>
            <option value="DISCIPLINA_EMENTA">DISCIPLINA_EMENTA</option>
            <option value="ESTAGIO_TCC">ESTAGIO_TCC</option>
            <option value="AVALIACAO_FREQUENCIA">AVALIACAO_FREQUENCIA</option>
            <option value="INGRESSO_MATRICULA">INGRESSO_MATRICULA</option>
            <option value="ATIVIDADES_EXTRAS">ATIVIDADES_EXTRAS</option>
            <option value="ASSISTENCIA_BOLSAS">ASSISTENCIA_BOLSAS</option>
            <option value="INFRA_CAMPUS">INFRA_CAMPUS</option>
            <option value="DIREITOS_DEVERES">DIREITOS_DEVERES</option>
            <option value="GREETING">GREETING</option>
            <option value="OUTRAS">OUTRAS</option>
          </select>

          {/* Feedback */}
          <select
            className="stats-select"
            value={feedbackFilter}
            onChange={(e) => {
              setFeedbackFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Todos os Feedbacks</option>
            <option value="up">👍 Positivos</option>
            <option value="down">👎 Negativos</option>
            <option value="none">Sem Avaliação</option>
          </select>
        </div>

        <div className="stats-filter-row">
          {/* Campo de Busca Livre */}
          <div className="stats-search-box">
            <Search size={16} className="stats-search-icon" />
            <input
              type="text"
              placeholder="Filtrar por pergunta ou resposta..."
              className="stats-search-input"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Botões de Ação */}
          <button
            className="stats-btn-refresh"
            onClick={fetchData}
            title="Atualizar dados"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>

          <button
            className="stats-btn-export"
            onClick={handleExportCSV}
            title="Baixar planilha CSV"
          >
            <Download size={15} />
            Exportar CSV
          </button>
        </div>
      </section>

      {/* KPI Cards Grid */}
      <section className="stats-kpi-grid">
        <div className="stats-kpi-card">
          <div className="stats-kpi-header">
            <span className="stats-kpi-title">Total de Interações</span>
            <div className="stats-kpi-icon">
              <BarChart3 size={18} />
            </div>
          </div>
          <div className="stats-kpi-value">{overview?.totalInteractions ?? 0}</div>
          <div className="stats-kpi-sub">
            <span className="stats-kpi-tag tag-rag">RAG: {overview?.byMode.rag ?? 0}</span>
            <span className="stats-kpi-tag tag-agent">MCP: {overview?.byMode.agent ?? 0}</span>
            <span className="stats-kpi-tag tag-beta">Beta: {overview?.byMode.agent_beta ?? 0}</span>
          </div>
        </div>

        <div className="stats-kpi-card">
          <div className="stats-kpi-header">
            <span className="stats-kpi-title">Latência Média Geral</span>
            <div className="stats-kpi-icon">
              <Clock size={18} />
            </div>
          </div>
          <div className="stats-kpi-value">
            {formatLatency(overview?.latency.overallAvgMs ?? 0)}
          </div>
          <div className="stats-kpi-sub">
            <span>RAG: {formatLatency(overview?.latency.ragAvgMs ?? 0)}</span>
            <span>•</span>
            <span>MCP: {formatLatency(overview?.latency.agentAvgMs ?? 0)}</span>
            <span>•</span>
            <span>Beta: {formatLatency(overview?.latency.betaAvgMs ?? 0)}</span>
          </div>
        </div>

        <div className="stats-kpi-card">
          <div className="stats-kpi-header">
            <span className="stats-kpi-title">Taxa de Satisfação</span>
            <div className="stats-kpi-icon">
              <ThumbsUp size={18} />
            </div>
          </div>
          <div className="stats-kpi-value">
            {overview?.feedback.satisfactionRate ?? 0}%
          </div>
          <div className="stats-kpi-sub">
            <span>👍 {overview?.feedback.up ?? 0} positivos</span>
            <span>•</span>
            <span>👎 {overview?.feedback.down ?? 0} negativos</span>
          </div>
        </div>

        <div className="stats-kpi-card">
          <div className="stats-kpi-header">
            <span className="stats-kpi-title">Modo Predominante</span>
            <div className="stats-kpi-icon">
              <Cpu size={18} />
            </div>
          </div>
          <div className="stats-kpi-value">
            {overview?.byMode.agent_beta && overview.byMode.agent_beta >= (overview.byMode.rag || 0)
              ? 'Agente Beta'
              : overview?.byMode.agent && overview.byMode.agent >= (overview.byMode.rag || 0)
              ? 'Agente MCP'
              : 'RAG Clássico'}
          </div>
          <div className="stats-kpi-sub">
            <span>
              {overview?.totalInteractions
                ? `${Math.round(
                    (Math.max(
                      overview.byMode.rag,
                      overview.byMode.agent,
                      overview.byMode.agent_beta
                    ) /
                      overview.totalInteractions) *
                      100
                  )}% do volume total`
                : 'Sem dados'}
            </span>
          </div>
        </div>
      </section>

      {/* Visual Analytics Grid */}
      <section className="stats-analytics-grid">
        {/* Comparativo de Desempenho por Modo */}
        <div className="stats-analytics-card">
          <h3>
            <Layers size={18} /> Comparativo de Modos
          </h3>
          <div className="stats-mode-list">
            {/* RAG */}
            <div className="stats-mode-row">
              <div className="stats-mode-info">
                <span className="stats-mode-name">📚 RAG Clássico</span>
                <span>
                  {overview?.byMode.rag ?? 0} reqs • {formatLatency(overview?.latency.ragAvgMs ?? 0)}
                </span>
              </div>
              <div className="stats-bar-track">
                <div
                  className="stats-bar-fill"
                  style={{
                    width: `${
                      overview?.totalInteractions
                        ? ((overview.byMode.rag || 0) / overview.totalInteractions) * 100
                        : 0
                    }%`,
                    backgroundColor: 'var(--stats-badge-rag)',
                  }}
                />
              </div>
            </div>

            {/* Agente Baseline */}
            <div className="stats-mode-row">
              <div className="stats-mode-info">
                <span className="stats-mode-name">🤖 Agente MCP Baseline</span>
                <span>
                  {overview?.byMode.agent ?? 0} reqs • {formatLatency(overview?.latency.agentAvgMs ?? 0)}
                </span>
              </div>
              <div className="stats-bar-track">
                <div
                  className="stats-bar-fill"
                  style={{
                    width: `${
                      overview?.totalInteractions
                        ? ((overview.byMode.agent || 0) / overview.totalInteractions) * 100
                        : 0
                    }%`,
                    backgroundColor: 'var(--stats-badge-agent)',
                  }}
                />
              </div>
            </div>

            {/* Agente Beta */}
            <div className="stats-mode-row">
              <div className="stats-mode-info">
                <span className="stats-mode-name">🚀 Agente Beta</span>
                <span>
                  {overview?.byMode.agent_beta ?? 0} reqs • {formatLatency(overview?.latency.betaAvgMs ?? 0)}
                </span>
              </div>
              <div className="stats-bar-track">
                <div
                  className="stats-bar-fill"
                  style={{
                    width: `${
                      overview?.totalInteractions
                        ? ((overview.byMode.agent_beta || 0) / overview.totalInteractions) * 100
                        : 0
                    }%`,
                    backgroundColor: 'var(--stats-badge-beta)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Distribuição por Intenção */}
        <div className="stats-analytics-card">
          <h3>
            <Filter size={18} /> Top Intenções Identificadas
          </h3>
          <div className="stats-intent-list">
            {overview?.intentsDistribution && overview.intentsDistribution.length > 0 ? (
              overview.intentsDistribution.slice(0, 5).map((item) => (
                <div key={item.intent} className="stats-intent-item">
                  <span className="stats-intent-badge">{item.intent}</span>
                  <span>
                    <strong>{item.count}</strong> interações
                  </span>
                </div>
              ))
            ) : (
              <div className="stats-empty-state">Nenhuma intenção registrada no período.</div>
            )}
          </div>
        </div>

        {/* Fontes mais Consultadas */}
        <div className="stats-analytics-card">
          <h3>
            <BookOpen size={18} /> Documentos Mais Consultados
          </h3>
          <div className="stats-source-list">
            {overview?.topSources && overview.topSources.length > 0 ? (
              overview.topSources.slice(0, 5).map((item) => (
                <div key={item.source} className="stats-source-item">
                  <span className="stats-source-name" title={item.source}>
                    📄 {item.source}
                  </span>
                  <span>
                    <strong>{item.count}</strong>x
                  </span>
                </div>
              ))
            ) : (
              <div className="stats-empty-state">Nenhum documento citado no período.</div>
            )}
          </div>
        </div>
      </section>

      {/* Histórico de Interações */}
      <section className="stats-table-card">
        <div className="stats-table-header">
          <h3>Histórico Completo de Interações ({totalRecords})</h3>
          <div className="stats-pagination-actions">
            <span>Linhas por página:</span>
            <select
              className="stats-select"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        <div className="stats-table-wrapper">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Modo</th>
                <th>Pergunta</th>
                <th>Intenção</th>
                <th>Latência</th>
                <th>Ferramentas</th>
                <th>Feedback</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {interactions.length > 0 ? (
                interactions.map((item) => {
                  const modeInfo = getModeLabel(item.mode);
                  return (
                    <tr key={item.id}>
                      <td>{new Date(item.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td>
                        <span className={`badge-mode ${modeInfo.cls}`}>{modeInfo.label}</span>
                      </td>
                      <td className="stats-col-question" title={item.question}>
                        {item.question}
                      </td>
                      <td>
                        <span className="stats-intent-badge">{item.intent || '—'}</span>
                      </td>
                      <td>
                        <span className={`badge-latency ${getLatencyBadgeClass(item.total_duration_ms)}`}>
                          {formatLatency(item.total_duration_ms)}
                        </span>
                      </td>
                      <td>
                        {item.tool_calls && item.tool_calls.length > 0 ? (
                          <span title={item.tool_calls.map((t) => t.name).join(', ')}>
                            🔧 {item.tool_calls.length} tool(s)
                          </span>
                        ) : (
                          <span style={{ opacity: 0.5 }}>—</span>
                        )}
                      </td>
                      <td>
                        {item.feedback === 'up' ? (
                          <span title="Avaliação positiva" style={{ color: 'var(--stats-success)' }}>
                            <ThumbsUp size={16} />
                          </span>
                        ) : item.feedback === 'down' ? (
                          <span title="Avaliação negativa" style={{ color: 'var(--stats-danger)' }}>
                            <ThumbsDown size={16} />
                          </span>
                        ) : (
                          <span style={{ opacity: 0.4 }}>—</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn-details"
                          onClick={() => setSelectedInteraction(item)}
                        >
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="stats-empty-state">
                    {loading ? 'Carregando dados...' : 'Nenhuma interação encontrada para os filtros selecionados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="stats-pagination">
          <span>
            Página {page} de {totalPages} ({totalRecords} registros)
          </span>
          <div className="stats-pagination-actions">
            <button
              className="stats-page-btn"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <button
              className="stats-page-btn"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Modal de Detalhes da Interação */}
      {selectedInteraction && (
        <div className="stats-modal-backdrop" onClick={() => setSelectedInteraction(null)}>
          <div className="stats-modal" onClick={(e) => e.stopPropagation()}>
            <div className="stats-modal-header">
              <h2>
                <span>Interação #{selectedInteraction.id}</span>
                <span className={`badge-mode ${getModeLabel(selectedInteraction.mode).cls}`}>
                  {getModeLabel(selectedInteraction.mode).label}
                </span>
              </h2>
              <button
                className="stats-modal-close"
                onClick={() => setSelectedInteraction(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="stats-modal-body">
              {/* Informações Gerais */}
              <div className="stats-timings-grid">
                <div className="stats-timing-card">
                  <span>Data/Hora</span>
                  <strong>{new Date(selectedInteraction.created_at).toLocaleTimeString('pt-BR')}</strong>
                </div>
                <div className="stats-timing-card">
                  <span>Latência Total</span>
                  <strong>{formatLatency(selectedInteraction.total_duration_ms)}</strong>
                </div>
                <div className="stats-timing-card">
                  <span>Intenção</span>
                  <strong>{selectedInteraction.intent || 'N/A'}</strong>
                </div>
                <div className="stats-timing-card">
                  <span>Avaliação</span>
                  <strong>
                    {selectedInteraction.feedback === 'up'
                      ? '👍 Positivo'
                      : selectedInteraction.feedback === 'down'
                      ? '👎 Negativo'
                      : 'Sem avaliação'}
                  </strong>
                </div>
              </div>

              {/* Decomposição de Latência (se disponível) */}
              {selectedInteraction.timings && (
                <div className="stats-detail-block">
                  <div className="stats-detail-label">Decomposição das Etapas de Latência</div>
                  <div className="stats-timings-grid">
                    <div className="stats-timing-card">
                      <span>Reescrita</span>
                      <strong>{selectedInteraction.timings.rewrite_ms ?? 0}ms</strong>
                    </div>
                    <div className="stats-timing-card">
                      <span>Embeddings</span>
                      <strong>{selectedInteraction.timings.embedding_ms ?? 0}ms</strong>
                    </div>
                    <div className="stats-timing-card">
                      <span>Busca (DB)</span>
                      <strong>{selectedInteraction.timings.retrieval_ms ?? 0}ms</strong>
                    </div>
                    <div className="stats-timing-card">
                      <span>Geração LLM</span>
                      <strong>{selectedInteraction.timings.generation_ms ?? 0}ms</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Pergunta */}
              <div className="stats-detail-block">
                <div className="stats-detail-label">Pergunta do Discente</div>
                <div className="stats-detail-content" style={{ fontWeight: 600 }}>
                  {selectedInteraction.question}
                </div>
                {selectedInteraction.contextualized_question &&
                  selectedInteraction.contextualized_question !== selectedInteraction.question && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--stats-text-muted)' }}>
                      <em>Reescrita/Contextualizada:</em> {selectedInteraction.contextualized_question}
                    </div>
                  )}
              </div>

              {/* Ferramentas Chamadas (Agente) */}
              {selectedInteraction.tool_calls && selectedInteraction.tool_calls.length > 0 && (
                <div className="stats-detail-block">
                  <div className="stats-detail-label">Ferramentas Executadas</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedInteraction.tool_calls.map((t, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'var(--stats-bg-card)',
                          padding: '0.6rem',
                          borderRadius: '6px',
                          border: '1px solid var(--stats-border)',
                          fontSize: '0.82rem',
                          fontFamily: 'monospace',
                        }}
                      >
                        <strong>{t.name}</strong>({JSON.stringify(t.arguments || {})})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fontes Citadas */}
              {selectedInteraction.sources && selectedInteraction.sources.length > 0 && (
                <div className="stats-detail-block">
                  <div className="stats-detail-label">Documentos Consultados / Citados</div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
                    {selectedInteraction.sources.map((src, i) => (
                      <li key={i}>{src}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Resposta do Assistente */}
              <div className="stats-detail-block">
                <div className="stats-detail-label">Resposta Gerada</div>
                <div
                  className="stats-detail-content"
                  style={{
                    backgroundColor: 'var(--stats-bg-card)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--stats-border)',
                  }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedInteraction.response}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            <div className="stats-modal-footer">
              <button
                className="btn-details"
                onClick={() => setSelectedInteraction(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
