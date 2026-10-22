/**
 * Constantes e tipos para categorização de perfis e participantes da pesquisa.
 * Garantem integridade dos dados e proteção LGPD (whitelist estrita de campos).
 */

export const PROFILE_TYPES = {
  ALUNO_GRADUACAO: "aluno_graduacao",
  ALUNO_TECNICO: "aluno_tecnico",
  DOCENTE: "docente",
  TAE: "tae",
} as const;

export type ProfileType = typeof PROFILE_TYPES[keyof typeof PROFILE_TYPES];

export const COURSES = {
  BSI: "bsi",
  ADMINISTRACAO: "adm",
  ENGENHARIA_METALURGICA: "eng_metalurgica",
  PEDAGOGIA: "pedagogia",
  TECNICO_GERAL: "tecnico_geral",
} as const;

export type CourseType = typeof COURSES[keyof typeof COURSES];

export const COURSE_PHASES = {
  INICIAL: "inicial",
  INTERMEDIARIA: "intermediaria",
  CONCLUINTE: "concluinte",
} as const;

export type CoursePhaseType = typeof COURSE_PHASES[keyof typeof COURSE_PHASES];

export const PROFILE_LABELS: Record<ProfileType, string> = {
  aluno_graduacao: "Aluno(a) de Graduação",
  aluno_tecnico: "Aluno(a) de Curso Técnico",
  docente: "Docente",
  tae: "Técnico-Administrativo",
};

export const COURSE_LABELS: Record<CourseType, string> = {
  bsi: "Sistemas de Informação",
  adm: "Administração",
  eng_metalurgica: "Engenharia Metalúrgica",
  pedagogia: "Licenciatura em Pedagogia",
  tecnico_geral: "Curso Técnico",
};

export const PHASE_LABELS: Record<CoursePhaseType, string> = {
  inicial: "Fase Inicial",
  intermediaria: "Fase Intermediária",
  concluinte: "Fase Concluinte / TCC / Estágio",
};

/**
 * Validador de consistência de perfil e curso.
 */
export function validateParticipantProfile(data: {
  participantId: string;
  profileType: string;
  course?: string | null;
  coursePhase?: string | null;
}): { valid: boolean; error?: string } {
  const { participantId, profileType, course, coursePhase } = data;

  // Validação de UUID v4
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!participantId || !uuidRegex.test(participantId)) {
    return { valid: false, error: "participantId deve ser um UUID v4 válido." };
  }

  // Validação de tipo de perfil
  const validProfileTypes = Object.values(PROFILE_TYPES) as string[];
  if (!profileType || !validProfileTypes.includes(profileType)) {
    return { valid: false, error: `profileType inválido. Deve ser um de: ${validProfileTypes.join(", ")}` };
  }

  // Regras para Aluno de Graduação
  if (profileType === PROFILE_TYPES.ALUNO_GRADUACAO) {
    const validGradCourses = [COURSES.BSI, COURSES.ADMINISTRACAO, COURSES.ENGENHARIA_METALURGICA, COURSES.PEDAGOGIA] as string[];
    if (!course || !validGradCourses.includes(course)) {
      return { valid: false, error: `Curso inválido para aluno de graduação. Deve ser um de: ${validGradCourses.join(", ")}` };
    }
    const validPhases = [COURSE_PHASES.INICIAL, COURSE_PHASES.INTERMEDIARIA, COURSE_PHASES.CONCLUINTE] as string[];
    if (!coursePhase || !validPhases.includes(coursePhase)) {
      return { valid: false, error: `Fase do curso inválida. Deve ser uma de: ${validPhases.join(", ")}` };
    }
  }

  // Regras para Aluno Técnico
  if (profileType === PROFILE_TYPES.ALUNO_TECNICO) {
    if (course && course !== COURSES.TECNICO_GERAL) {
      return { valid: false, error: "Curso para aluno técnico deve ser 'tecnico_geral'." };
    }
    const validPhases = [COURSE_PHASES.INICIAL, COURSE_PHASES.CONCLUINTE] as string[];
    if (coursePhase && !validPhases.includes(coursePhase)) {
      return { valid: false, error: `Fase para curso técnico deve ser 'inicial' ou 'concluinte'.` };
    }
  }

  // Regras para Servidores (Docente ou TAE)
  if (profileType === PROFILE_TYPES.DOCENTE || profileType === PROFILE_TYPES.TAE) {
    // Curso e fase não se aplicam
  }

  return { valid: true };
}
