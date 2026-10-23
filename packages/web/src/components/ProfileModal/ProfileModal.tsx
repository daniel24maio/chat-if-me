import React, { useEffect, useRef, useState } from 'react';
import './ProfileModal.styles.css';

export interface ParticipantProfile {
  profileType: 'aluno_graduacao' | 'aluno_tecnico' | 'docente' | 'tae';
  course?: 'bsi' | 'adm' | 'eng_metalurgica' | 'pedagogia' | 'tecnico_geral' | null;
  coursePhase?: 'inicial' | 'intermediaria' | 'concluinte' | null;
}

interface ProfileModalProps {
  isOpen: boolean;
  apiUrl: string;
  onConfirm: (participantId: string, profile: ParticipantProfile) => void;
}

/** Identificadores das etapas do assistente de coleta */
type StepKey = 'vinculo' | 'curso' | 'fase' | 'confirmacao';

/** Rótulos curtos exibidos no indicador de progresso */
const STEP_LABELS: Record<StepKey, string> = {
  vinculo: 'Vínculo',
  curso: 'Curso',
  fase: 'Etapa do curso',
  confirmacao: 'Confirmação',
};

/** Atraso do avanço automático, para o usuário ver a opção marcada */
const AUTO_ADVANCE_DELAY_MS = 280;

/**
 * Define a sequência de etapas conforme o vínculo escolhido.
 * Antes da escolha, apenas a etapa de vínculo é conhecida.
 */
const getSteps = (profileType: ParticipantProfile['profileType'] | null): StepKey[] => {
  switch (profileType) {
    case 'aluno_graduacao':
      return ['vinculo', 'curso', 'fase'];
    case 'aluno_tecnico':
      return ['vinculo', 'fase'];
    case 'docente':
    case 'tae':
      return ['vinculo', 'confirmacao'];
    default:
      return ['vinculo'];
  }
};

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  apiUrl,
  onConfirm,
}) => {
  const [profileType, setProfileType] = useState<ParticipantProfile['profileType'] | null>(null);
  const [course, setCourse] = useState<ParticipantProfile['course'] | null>(null);
  const [coursePhase, setCoursePhase] = useState<ParticipantProfile['coursePhase'] | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stepTitleRef = useRef<HTMLHeadingElement>(null);
  const advanceTimerRef = useRef<number | null>(null);

  const steps = getSteps(profileType);
  const activeStep = steps[currentStep] ?? 'vinculo';
  const isLastStep = profileType !== null && currentStep === steps.length - 1;

  // Reinicia o assistente sempre que o modal for reaberto (nova sessão/participante)
  useEffect(() => {
    if (isOpen) {
      setProfileType(null);
      setCourse(null);
      setCoursePhase(null);
      setCurrentStep(0);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Move o foco para o título da etapa atual (acessibilidade / leitores de tela)
  useEffect(() => {
    if (isOpen) {
      stepTitleRef.current?.focus({ preventScroll: true });
    }
  }, [currentStep, isOpen]);

  // Limpa o temporizador do avanço automático ao desmontar
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  /** Agenda a ida para a etapa indicada após um pequeno atraso */
  const scheduleAdvance = (nextStep: number) => {
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = window.setTimeout(() => {
      setCurrentStep(nextStep);
      advanceTimerRef.current = null;
    }, AUTO_ADVANCE_DELAY_MS);
  };

  /** Indica se a etapa atual já possui uma resposta válida */
  const isStepComplete = (step: StepKey): boolean => {
    switch (step) {
      case 'vinculo':
        return profileType !== null;
      case 'curso':
        return Boolean(course);
      case 'fase':
        return Boolean(coursePhase);
      case 'confirmacao':
        return true;
      default:
        return false;
    }
  };

  // Validação para habilitar o botão final
  const isReadyToSubmit = (() => {
    if (!profileType) return false;
    if (profileType === 'docente' || profileType === 'tae') return true;
    if (profileType === 'aluno_graduacao') {
      return Boolean(course && coursePhase);
    }
    if (profileType === 'aluno_tecnico') {
      return Boolean(coursePhase);
    }
    return false;
  })();

  const handleSelectProfile = (type: ParticipantProfile['profileType']) => {
    // Trocar de vínculo descarta as respostas das etapas seguintes
    if (type !== profileType) {
      setProfileType(type);
      setCourse(type === 'aluno_tecnico' ? 'tecnico_geral' : null);
      setCoursePhase(null);
    }
    setErrorMessage(null);
    scheduleAdvance(1);
  };

  const handleSelectCourse = (value: NonNullable<ParticipantProfile['course']>) => {
    setCourse(value);
    // Na graduação, a etapa de curso é seguida pela etapa de fase
    scheduleAdvance(currentStep + 1);
  };

  const handleSelectPhase = (value: NonNullable<ParticipantProfile['coursePhase']>) => {
    // Fase é a última etapa dos alunos: apenas habilita o botão de liberar acesso
    setCoursePhase(value);
  };

  const handleBack = () => {
    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    if (!isStepComplete(activeStep) || isLastStep) return;
    setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReadyToSubmit || !profileType || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const participantId = crypto.randomUUID();
    const resolvedCourse =
      profileType === 'aluno_tecnico'
        ? 'tecnico_geral'
        : profileType === 'aluno_graduacao'
        ? course
        : null;

    const payload: ParticipantProfile = {
      profileType,
      course: resolvedCourse,
      coursePhase: profileType === 'docente' || profileType === 'tae' ? null : coursePhase,
    };

    try {
      const response = await fetch(`${apiUrl}/api/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          ...payload,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao registrar dados do participante');
      }

      onConfirm(participantId, payload);
    } catch (err) {
      console.error('[ProfileModal] Erro ao registrar perfil:', err);
      // Mesmo com erro de conexão, permite fallback para não travar totalmente a experiência
      setErrorMessage('Não foi possível conectar ao servidor. Clique novamente para tentar ou prosseguir.');
      // Se já houver tentado uma vez e o usuário clicar de novo, liberamos localmente
      if (errorMessage) {
        onConfirm(participantId, payload);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Título da etapa atual */
  const stepTitle: Record<StepKey, string> = {
    vinculo: 'Qual é o seu vínculo com o campus?',
    curso: 'Qual é o seu curso de graduação?',
    fase:
      profileType === 'aluno_tecnico'
        ? 'Em qual etapa do curso técnico você está?'
        : 'Em qual etapa do curso você está?',
    confirmacao: 'Confirme seu perfil',
  };

  const renderVinculo = () => (
    <div className="profile-grid-2x2" role="radiogroup" aria-label="Selecione seu vínculo">
      {(
        [
          { value: 'aluno_graduacao', icon: '🎓', label: 'Aluno(a) de Graduação' },
          { value: 'aluno_tecnico', icon: '🛠️', label: 'Aluno(a) de Curso Técnico' },
          { value: 'docente', icon: '👨‍🏫', label: 'Docente' },
          { value: 'tae', icon: '🏢', label: 'Técnico-Administrativo' },
        ] as const
      ).map((opt) => (
        <button
          key={opt.value}
          id={`profile-option-${opt.value}`}
          type="button"
          className={`profile-card-option ${profileType === opt.value ? 'selected' : ''}`}
          onClick={() => handleSelectProfile(opt.value)}
          role="radio"
          aria-checked={profileType === opt.value}
        >
          <span className="profile-card-icon">{opt.icon}</span>
          <span className="profile-card-label">{opt.label}</span>
        </button>
      ))}
    </div>
  );

  const renderCurso = () => (
    <div className="profile-courses-list" role="radiogroup" aria-label="Selecione seu curso">
      {(
        [
          { value: 'bsi', label: '💻 Bacharelado em Sistemas de Informação' },
          { value: 'adm', label: '📊 Bacharelado em Administração' },
          { value: 'eng_metalurgica', label: '⚙️ Engenharia Metalúrgica' },
          { value: 'pedagogia', label: '📖 Licenciatura em Pedagogia' },
        ] as const
      ).map((opt) => (
        <button
          key={opt.value}
          id={`profile-course-${opt.value}`}
          type="button"
          className={`profile-course-item ${course === opt.value ? 'selected' : ''}`}
          onClick={() => handleSelectCourse(opt.value)}
          role="radio"
          aria-checked={course === opt.value}
        >
          <span className="profile-radio-dot">
            <span className="profile-radio-dot-inner" />
          </span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );

  const renderFase = () => {
    const options =
      profileType === 'aluno_tecnico'
        ? ([
            { value: 'inicial', title: '🟢 Fase Inicial', desc: '1º ano / Módulos iniciais' },
            { value: 'concluinte', title: '🔴 Concluinte', desc: 'Último ano / Estágio' },
          ] as const)
        : ([
            { value: 'inicial', title: '🟢 Fase Inicial', desc: '1º ao 3º período' },
            { value: 'intermediaria', title: '🟡 Fase Intermediária', desc: '4º ao 6º período' },
            { value: 'concluinte', title: '🔴 Concluinte', desc: '7º período+ / TCC / Estágio' },
          ] as const);

    return (
      <div
        className={`profile-phases-list ${profileType === 'aluno_tecnico' ? 'phases-two-cols' : ''}`}
        role="radiogroup"
        aria-label="Selecione a fase do curso"
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            id={`profile-phase-${opt.value}`}
            type="button"
            className={`profile-phase-item ${coursePhase === opt.value ? 'selected' : ''}`}
            onClick={() => handleSelectPhase(opt.value)}
            role="radio"
            aria-checked={coursePhase === opt.value}
          >
            <span className="profile-phase-title">{opt.title}</span>
            <span className="profile-phase-desc">{opt.desc}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderConfirmacao = () => (
    <div className="profile-server-notice">
      <span className="profile-server-notice-icon">{profileType === 'docente' ? '👨‍🏫' : '🏢'}</span>
      <span>
        Perfil de <strong>{profileType === 'docente' ? 'Docente' : 'Técnico-Administrativo'}</strong> selecionado.
        Suas dúvidas e testes serão analisados sob a perspectiva do corpo de servidores.
        <span className="profile-server-notice-hint">
          Se estiver correto, clique em <strong>Liberar Acesso ao Chat</strong>. Caso contrário, use <strong>Voltar</strong>.
        </span>
      </span>
    </div>
  );

  const progressLabel = profileType
    ? `Etapa ${currentStep + 1} de ${steps.length} · ${STEP_LABELS[activeStep]}`
    : `Etapa 1 · ${STEP_LABELS.vinculo}`;

  return (
    <div
      className="profile-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="profile-modal-container">
        {/* Cabeçalho */}
        <div className={`profile-modal-header ${currentStep > 0 ? 'compact' : ''}`}>
          <div className="profile-header-top">
            <h2 id="profile-modal-title" className="profile-modal-title">
              Bem-vindo(a) ao Chat IFMG
            </h2>
            <span className="profile-badge">
              <span>🏛️</span> Campus Ouro Branco
            </span>
          </div>

          {currentStep === 0 ? (
            <div className="profile-privacy-banner">
              <span className="privacy-banner-icon">🛡️</span>
              <div>
                <strong>Pesquisa de TCC e Privacidade (LGPD):</strong>
                <div>
                  Não coletamos nome, matrícula ou qualquer informação pessoal.
                  Seu perfil acadêmico é associado a um código anônimo para análise
                  estatística das respostas da IA.
                </div>
              </div>
            </div>
          ) : (
            <div className="profile-privacy-banner compact">
              <span className="privacy-banner-icon">🛡️</span>
              <span>Pesquisa anônima: nenhum dado pessoal é coletado (LGPD).</span>
            </div>
          )}
        </div>

        {/* Indicador de progresso */}
        <div className="profile-stepper" aria-live="polite">
          <div className="profile-stepper-track" aria-hidden="true">
            {(profileType ? steps : (['vinculo', null, null] as const)).map((step, idx) => (
              <span
                key={idx}
                className={`profile-stepper-segment ${
                  idx < currentStep ? 'done' : idx === currentStep ? 'active' : ''
                } ${step === null ? 'unknown' : ''}`}
              />
            ))}
          </div>
          <span className="profile-stepper-label">{progressLabel}</span>
        </div>

        {/* Corpo: uma etapa por vez */}
        <form onSubmit={handleSubmit} className="profile-modal-body">
          <div key={`${activeStep}-${currentStep}`} className="profile-step-panel">
            <h3
              ref={stepTitleRef}
              tabIndex={-1}
              className="profile-section-title"
              id="profile-step-title"
            >
              <span className="profile-step-number">{currentStep + 1}</span>
              {stepTitle[activeStep]}
            </h3>

            {activeStep === 'vinculo' && renderVinculo()}
            {activeStep === 'curso' && renderCurso()}
            {activeStep === 'fase' && renderFase()}
            {activeStep === 'confirmacao' && renderConfirmacao()}
          </div>
        </form>

        {/* Rodapé com navegação */}
        <div className="profile-modal-footer">
          {currentStep > 0 && (
            <button
              id="profile-back-btn"
              type="button"
              className="profile-back-btn"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              ← Voltar
            </button>
          )}

          {errorMessage && (
            <span className="profile-error-alert">{errorMessage}</span>
          )}

          {isLastStep ? (
            <button
              id="profile-submit-btn"
              type="button"
              className="profile-submit-btn"
              disabled={!isReadyToSubmit || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Salvando...' : 'Liberar Acesso ao Chat →'}
            </button>
          ) : (
            <button
              id="profile-next-btn"
              type="button"
              className="profile-submit-btn"
              disabled={!isStepComplete(activeStep)}
              onClick={handleNext}
            >
              Próximo →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default ProfileModal;
