import type { DocumentoRecuperado } from "../interfaces/chat.interfaces.js";

/**
 * Serviço de Memória de Sessão em RAM.
 *
 * Mantém o contexto conversacional entre perguntas do mesmo aluno,
 * permitindo:
 *   - Resolução de pronomes anafóricos ("dessa", "desse", "nessa")
 *   - Reutilização de entidades acadêmicas mencionadas anteriormente
 *   - Contextualização da reescrita de query (Query Rewriting)
 *
 * Estrutura: Map<sessionId, SessionContext>
 *
 * Política:
 *   - TTL de 5 minutos de inatividade
 *   - Máximo de 100 sessões simultâneas (evicção LRU)
 *   - Máximo de 10 mensagens por sessão (sliding window)
 *   - Garbage collector a cada 30 segundos
 */

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

/** Tempo máximo de inatividade antes de expirar a sessão (5 minutos) */
const SESSION_TTL_MS = 5 * 60 * 1000;

/** Intervalo do garbage collector (30 segundos) */
const CLEANUP_INTERVAL_MS = 30 * 1000;

/** Número máximo de sessões ativas em memória */
const MAX_SESSIONS = 100;

/** Número máximo de mensagens armazenadas por sessão (sliding window) */
const MAX_MESSAGES_PER_SESSION = 10;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** Mensagem armazenada na memória da sessão */
interface SessionMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

/** Entidades acadêmicas extraídas da conversa */
interface EntityMemory {
  /** Disciplinas mencionadas (ex: ["Cálculo 1", "Algoritmos"]) */
  disciplinas: string[];
  /** Períodos mencionados (ex: [5, 6]) */
  periodos: number[];
  /** Temas/assuntos discutidos (ex: ["pré-requisitos", "carga horária"]) */
  temas: string[];
  /** Último assunto principal da conversa (usado para resolução de pronomes) */
  ultimoAssunto: string;
}

/** Contexto completo de uma sessão */
export interface SessionContext {
  sessionId: string;
  messages: SessionMessage[];
  entities: EntityMemory;
  lastIntent: string;
  lastDocuments: DocumentoRecuperado[];
  createdAt: number;
  lastAccessedAt: number;
}

// ---------------------------------------------------------------------------
// Armazém global de sessões
// ---------------------------------------------------------------------------

const sessions = new Map<string, SessionContext>();

/**
 * IDs de sessões que já expiraram e foram removidas.
 * Mantido temporariamente para que o backend possa notificar o frontend
 * de que a sessão expirou (em vez de criar uma nova silenciosamente).
 *
 * Limpo junto com o garbage collector (entradas com mais de 10 minutos).
 */
const expiredSessions = new Map<string, number>();

// ---------------------------------------------------------------------------
// Garbage Collector (TTL)
// ---------------------------------------------------------------------------

/**
 * Varredura periódica: remove sessões inativas há mais de SESSION_TTL_MS.
 * Loga no terminal cada sessão removida para rastreabilidade.
 */
const cleanupInterval = setInterval(() => {
  const agora = Date.now();
  let removidas = 0;

  for (const [id, ctx] of sessions) {
    if (agora - ctx.lastAccessedAt > SESSION_TTL_MS) {
      sessions.delete(id);
      expiredSessions.set(id, agora);
      removidas++;
      console.log(
        `🧹 [Memória] Sessão expirada e removida: ${id.substring(0, 8)}... ` +
        `(${ctx.messages.length} msgs, ${Math.round((agora - ctx.createdAt) / 1000)}s de vida)`
      );
    }
  }

  // Limpa registros de expiração antigos (> 10 minutos)
  for (const [id, expiredAt] of expiredSessions) {
    if (agora - expiredAt > 10 * 60 * 1000) {
      expiredSessions.delete(id);
    }
  }

  if (removidas > 0) {
    console.log(
      `🧹 [Memória] ${removidas} sessão(ões) removida(s). Ativas: ${sessions.size}`
    );
  }
}, CLEANUP_INTERVAL_MS);

// Impede que o setInterval mantenha o processo Node.js vivo
cleanupInterval.unref();

// ---------------------------------------------------------------------------
// Funções públicas
// ---------------------------------------------------------------------------

/**
 * Verifica se uma sessão conhecida expirou.
 * Retorna true se o sessionId corresponde a uma sessão que existiu e foi
 * removida pelo garbage collector. Retorna false se a sessão ainda existe
 * ou se nunca existiu (sessão nova).
 */
export function isSessionExpired(sessionId: string): boolean {
  // Se a sessão ainda existe e está ativa, não expirou
  if (sessions.has(sessionId)) {
    return false;
  }

  // Se o ID está na lista de expiradas, sim, expirou
  return expiredSessions.has(sessionId);
}

/**
 * Recupera uma sessão existente ou cria uma nova.
 *
 * Se o limite de MAX_SESSIONS for atingido, remove a sessão mais antiga
 * (política LRU — Least Recently Used).
 */
export function getOrCreateSession(sessionId: string): SessionContext {
  const existente = sessions.get(sessionId);

  if (existente) {
    existente.lastAccessedAt = Date.now();
    return existente;
  }

  // Evicção LRU se atingiu o limite
  if (sessions.size >= MAX_SESSIONS) {
    let oldestId = "";
    let oldestTime = Infinity;

    for (const [id, ctx] of sessions) {
      if (ctx.lastAccessedAt < oldestTime) {
        oldestTime = ctx.lastAccessedAt;
        oldestId = id;
      }
    }

    if (oldestId) {
      sessions.delete(oldestId);
      console.log(
        `🧹 [Memória] Sessão evicta (LRU) para liberar espaço: ${oldestId.substring(0, 8)}...`
      );
    }
  }

  // Cria nova sessão
  const novaSessao: SessionContext = {
    sessionId,
    messages: [],
    entities: {
      disciplinas: [],
      periodos: [],
      temas: [],
      ultimoAssunto: "",
    },
    lastIntent: "",
    lastDocuments: [],
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
  };

  sessions.set(sessionId, novaSessao);

  console.log(
    `🧠 [Memória] Nova sessão criada: ${sessionId.substring(0, 8)}... ` +
    `(total ativas: ${sessions.size})`
  );

  return novaSessao;
}

/**
 * Atualiza a sessão após o processamento de uma pergunta.
 *
 * Armazena a pergunta do usuário, atualiza a intenção detectada,
 * extrai entidades acadêmicas e mantém a sliding window de mensagens.
 */
export function updateSession(
  sessionId: string,
  pergunta: string,
  intent: string,
  resposta: string
): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  // Adiciona a mensagem do usuário
  session.messages.push({
    role: "user",
    content: pergunta,
    timestamp: Date.now(),
  });

  // Adiciona a resposta (se não vazia)
  if (resposta) {
    session.messages.push({
      role: "assistant",
      content: resposta,
      timestamp: Date.now(),
    });
  }

  // Sliding window: mantém apenas as últimas N mensagens
  if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
    session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION);
  }

  // Atualiza intenção
  session.lastIntent = intent;

  // Extrai e acumula entidades da pergunta
  extrairEntidades(pergunta, session.entities);

  // Atualiza timestamp de acesso
  session.lastAccessedAt = Date.now();
}

/**
 * Resolve referências anafóricas (pronomes) usando o contexto da sessão.
 *
 * Substitui pronomes demonstrativos e possessivos por entidades concretas
 * extraídas de perguntas anteriores, para que o Query Rewriting produza
 * uma consulta que faça sentido mesmo sem o contexto da conversa.
 *
 * Exemplos:
 *   "E os pré-requisitos dessa?" → "E os pré-requisitos de Cálculo 1?"
 *   "Qual a carga horária desse?" → "Qual a carga horária do 5º período?"
 *
 * @param pergunta - Pergunta atual do aluno (pode conter pronomes)
 * @param session  - Contexto da sessão com entidades extraídas
 * @returns Pergunta com pronomes substituídos (ou a original se não houver resolução)
 */
export function resolverReferencias(
  pergunta: string,
  session: SessionContext
): string {
  const { entities, messages } = session;

  // Se a sessão não tem histórico, retorna a pergunta original
  if (messages.length === 0) return pergunta;

  let perguntaResolvida = pergunta;

  // Padrão 1: Pronomes demonstrativos femininos → última disciplina
  // "dessa", "nessa", "desta", "dela", "essa"
  if (entities.disciplinas.length > 0) {
    const ultimaDisciplina = entities.disciplinas[entities.disciplinas.length - 1];
    perguntaResolvida = perguntaResolvida.replace(
      /\b(d?essa|nessa|desta|dela)\b/gi,
      `de ${ultimaDisciplina}`
    );
  }

  // Padrão 2: Pronomes demonstrativos masculinos → último período ou tema
  // "desse", "nesse", "deste", "dele", "esse"
  if (entities.periodos.length > 0) {
    const ultimoPeriodo = entities.periodos[entities.periodos.length - 1];
    perguntaResolvida = perguntaResolvida.replace(
      /\b(d?esse|nesse|deste|dele)\b/gi,
      `do ${ultimoPeriodo}º período`
    );
  } else if (entities.ultimoAssunto) {
    perguntaResolvida = perguntaResolvida.replace(
      /\b(d?esse|nesse|deste|dele)\b/gi,
      `de ${entities.ultimoAssunto}`
    );
  }

  // Padrão 3: "também" / "e sobre" → injeta contexto da última pergunta
  // Se a pergunta começa com "E ", "E sobre", "Também" sem sujeito claro
  if (/^(e\s|e\s+sobre\s|também\s)/i.test(perguntaResolvida) && entities.ultimoAssunto) {
    perguntaResolvida = `${perguntaResolvida} (contexto: ${entities.ultimoAssunto})`;
  }

  // Loga se houve resolução
  if (perguntaResolvida !== pergunta) {
    console.log(
      `🔗 [Memória] Pronomes resolvidos:\n` +
      `   Original:  "${pergunta}"\n` +
      `   Resolvida: "${perguntaResolvida}"`
    );
  }

  return perguntaResolvida;
}

/**
 * Retorna estatísticas das sessões ativas para o endpoint /api/health.
 */
export function getSessionStats(): {
  active: number;
  maxSessions: number;
  ttlMinutes: number;
  memoryEstimateKB: number;
} {
  // Estimativa grosseira: ~50-100 bytes por mensagem + metadados
  let totalMessages = 0;
  for (const session of sessions.values()) {
    totalMessages += session.messages.length;
  }

  return {
    active: sessions.size,
    maxSessions: MAX_SESSIONS,
    ttlMinutes: SESSION_TTL_MS / 60_000,
    memoryEstimateKB: Math.round((totalMessages * 100 + sessions.size * 500) / 1024),
  };
}

/**
 * Retorna os IDs dos últimos chunks utilizados pela sessão.
 * Usado pelo endpoint de feedback para associar chunks à avaliação
 * sem necessidade de alteração no frontend.
 */
export function obterChunkIdsDaSessao(sessionId?: string): number[] {
  if (!sessionId) return [];
  const session = sessions.get(sessionId);
  if (!session || !session.lastDocuments) return [];
  return session.lastDocuments
    .filter((doc) => doc.id != null)
    .map((doc) => doc.id);
}

/**
 * Remove todas as sessões (cleanup para SIGINT/SIGTERM).
 */
export function limparTodasSessoes(): void {
  const total = sessions.size;
  sessions.clear();
  expiredSessions.clear();
  console.log(`🧹 [Memória] Todas as ${total} sessão(ões) removidas (shutdown).`);
}

// ---------------------------------------------------------------------------
// Funções internas
// ---------------------------------------------------------------------------

/**
 * Extrai entidades acadêmicas de uma pergunta usando regex.
 *
 * Detecta:
 *   - Períodos (ex: "5º período", "terceiro período")
 *   - Disciplinas conhecidas do IFMG
 *   - Temas acadêmicos (TCC, estágio, matrícula, etc.)
 *
 * As entidades são acumuladas na sessão para uso em perguntas futuras.
 */
function extrairEntidades(texto: string, entities: EntityMemory): void {
  const textoLower = texto.toLowerCase();

  // ── Períodos ──
  const periodoNumerico = texto.match(/(\d+)[ºª°]?\s*per[ií]odo/i);
  if (periodoNumerico) {
    const num = Number(periodoNumerico[1]);
    if (!entities.periodos.includes(num)) {
      entities.periodos.push(num);
    }
  }

  // Períodos por extenso
  const periodosExtenso: Record<string, number> = {
    primeiro: 1, segundo: 2, terceiro: 3, quarto: 4, quinto: 5,
    sexto: 6, sétimo: 7, oitavo: 8, nono: 9, décimo: 10,
  };
  for (const [nome, num] of Object.entries(periodosExtenso)) {
    if (textoLower.includes(`${nome} período`) && !entities.periodos.includes(num)) {
      entities.periodos.push(num);
    }
  }

  // ── Disciplinas (vocabulário do curso de SI do IFMG) ──
  const disciplinas = [
    "Cálculo", "Cálculo 1", "Cálculo 2", "Cálculo 3",
    "Álgebra Linear", "Geometria Analítica",
    "Algoritmos", "Algoritmos e Programação",
    "Estrutura de Dados", "Estruturas de Dados",
    "Banco de Dados", "Bancos de Dados",
    "Engenharia de Software",
    "Sistemas Operacionais",
    "Redes de Computadores",
    "Inteligência Artificial",
    "Compiladores",
    "Programação Orientada a Objetos",
    "Arquitetura de Computadores",
    "Matemática Discreta",
    "Probabilidade e Estatística",
    "Física", "Física 1", "Física 2",
    "Lógica",
    "Teoria da Computação",
    "Interação Humano-Computador",
    "Trabalho de Conclusão de Curso", "TCC",
    "Estágio Supervisionado",
    "Projeto Integrador",
  ];

  for (const disciplina of disciplinas) {
    if (textoLower.includes(disciplina.toLowerCase())) {
      if (!entities.disciplinas.includes(disciplina)) {
        entities.disciplinas.push(disciplina);
      }
    }
  }

  // ── Temas acadêmicos ──
  const temas: Record<string, string> = {
    "pré-requisito": "pré-requisitos",
    "prerequisito": "pré-requisitos",
    "carga horária": "carga horária",
    "ementa": "ementa",
    "matrícula": "matrícula",
    "trancamento": "trancamento",
    "reprovação": "reprovação",
    "reprovar": "reprovação",
    "aprovação": "aprovação",
    "aprovar": "aprovação",
    "frequência": "frequência",
    "falta": "frequência",
    "estágio": "estágio",
    "atividades complementares": "atividades complementares",
    "horas complementares": "atividades complementares",
    "bolsa": "bolsas",
    "auxílio": "assistência estudantil",
    "biblioteca": "biblioteca",
    "laboratório": "laboratório",
    "disciplina": "disciplinas",
    "grade curricular": "grade curricular",
    "matriz curricular": "grade curricular",
  };

  for (const [termo, tema] of Object.entries(temas)) {
    if (textoLower.includes(termo) && !entities.temas.includes(tema)) {
      entities.temas.push(tema);
    }
  }

  // ── Último assunto (para resolução de "esse/essa") ──
  // Prioridade: disciplina > período > tema
  if (entities.disciplinas.length > 0) {
    entities.ultimoAssunto = entities.disciplinas[entities.disciplinas.length - 1];
  } else if (entities.periodos.length > 0) {
    entities.ultimoAssunto = `${entities.periodos[entities.periodos.length - 1]}º período`;
  } else if (entities.temas.length > 0) {
    entities.ultimoAssunto = entities.temas[entities.temas.length - 1];
  }
}
