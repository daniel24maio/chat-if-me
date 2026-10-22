import React, { useState } from 'react';
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

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  apiUrl,
  onConfirm,
}) => {
  const [profileType, setProfileType] = useState<ParticipantProfile['profileType'] | null>(null);
  const [course, setCourse] = useState<ParticipantProfile['course'] | null>(null);
  const [coursePhase, setCoursePhase] = useState<ParticipantProfile['coursePhase'] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Validação para habilitar o botão
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

  return (
    <div
      className="profile-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="profile-modal-container">
        {/* Cabeçalho */}
        <div className="profile-modal-header">
          <div className="profile-header-top">
            <h2 id="profile-modal-title" className="profile-modal-title">
              Bem-vindo(a) ao Chat IFMG
            </h2>
            <span className="profile-badge">
              <span>🏛️</span> Campus Ouro Branco
            </span>
          </div>

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
        </div>

        {/* Corpo com opções */}
        <form onSubmit={handleSubmit} className="profile-modal-body">
          {/* Passo 1: Vínculo */}
          <div>
            <h3 className="profile-section-title">
              <span className="profile-step-number">1</span>
              Qual é o seu vínculo com o campus?
            </h3>
            <div className="profile-grid-2x2" role="radiogroup" aria-label="Selecione seu vínculo">
              <button
                type="button"
                className={`profile-card-option ${profileType === 'aluno_graduacao' ? 'selected' : ''}`}
                onClick={() => {
                  setProfileType('aluno_graduacao');
                  setCourse(null);
                  setCoursePhase(null);
                  setErrorMessage(null);
                }}
                role="radio"
                aria-checked={profileType === 'aluno_graduacao'}
              >
                <span className="profile-card-icon">🎓</span>
                <span className="profile-card-label">Aluno(a) de Graduação</span>
              </button>

              <button
                type="button"
                className={`profile-card-option ${profileType === 'aluno_tecnico' ? 'selected' : ''}`}
                onClick={() => {
                  setProfileType('aluno_tecnico');
                  setCourse('tecnico_geral');
                  setCoursePhase(null);
                  setErrorMessage(null);
                }}
                role="radio"
                aria-checked={profileType === 'aluno_tecnico'}
              >
                <span className="profile-card-icon">🛠️</span>
                <span className="profile-card-label">Aluno(a) de Curso Técnico</span>
              </button>

              <button
                type="button"
                className={`profile-card-option ${profileType === 'docente' ? 'selected' : ''}`}
                onClick={() => {
                  setProfileType('docente');
                  setCourse(null);
                  setCoursePhase(null);
                  setErrorMessage(null);
                }}
                role="radio"
                aria-checked={profileType === 'docente'}
              >
                <span className="profile-card-icon">👨‍🏫</span>
                <span className="profile-card-label">Docente</span>
              </button>

              <button
                type="button"
                className={`profile-card-option ${profileType === 'tae' ? 'selected' : ''}`}
                onClick={() => {
                  setProfileType('tae');
                  setCourse(null);
                  setCoursePhase(null);
                  setErrorMessage(null);
                }}
                role="radio"
                aria-checked={profileType === 'tae'}
              >
                <span className="profile-card-icon">🏢</span>
                <span className="profile-card-label">Técnico-Administrativo</span>
              </button>
            </div>
          </div>

          {/* Passo 2: Curso (se aluno de graduação) */}
          {profileType === 'aluno_graduacao' && (
            <div>
              <h3 className="profile-section-title">
                <span className="profile-step-number">2</span>
                Qual é o seu curso de graduação?
              </h3>
              <div className="profile-courses-list" role="radiogroup" aria-label="Selecione seu curso">
                <button
                  type="button"
                  className={`profile-course-item ${course === 'bsi' ? 'selected' : ''}`}
                  onClick={() => setCourse('bsi')}
                  role="radio"
                  aria-checked={course === 'bsi'}
                >
                  <span className="profile-radio-dot">
                    <span className="profile-radio-dot-inner" />
                  </span>
                  <span>💻 Bacharelado em Sistemas de Informação</span>
                </button>

                <button
                  type="button"
                  className={`profile-course-item ${course === 'adm' ? 'selected' : ''}`}
                  onClick={() => setCourse('adm')}
                  role="radio"
                  aria-checked={course === 'adm'}
                >
                  <span className="profile-radio-dot">
                    <span className="profile-radio-dot-inner" />
                  </span>
                  <span>📊 Bacharelado em Administração</span>
                </button>

                <button
                  type="button"
                  className={`profile-course-item ${course === 'eng_metalurgica' ? 'selected' : ''}`}
                  onClick={() => setCourse('eng_metalurgica')}
                  role="radio"
                  aria-checked={course === 'eng_metalurgica'}
                >
                  <span className="profile-radio-dot">
                    <span className="profile-radio-dot-inner" />
                  </span>
                  <span>⚙️ Engenharia Metalúrgica</span>
                </button>

                <button
                  type="button"
                  className={`profile-course-item ${course === 'pedagogia' ? 'selected' : ''}`}
                  onClick={() => setCourse('pedagogia')}
                  role="radio"
                  aria-checked={course === 'pedagogia'}
                >
                  <span className="profile-radio-dot">
                    <span className="profile-radio-dot-inner" />
                  </span>
                  <span>📖 Licenciatura em Pedagogia</span>
                </button>
              </div>
            </div>
          )}

          {/* Passo 3: Fase do Curso (se aluno de graduação) */}
          {profileType === 'aluno_graduacao' && course && (
            <div>
              <h3 className="profile-section-title">
                <span className="profile-step-number">3</span>
                Em qual etapa do curso você está?
              </h3>
              <div className="profile-phases-list" role="radiogroup" aria-label="Selecione a fase do curso">
                <button
                  type="button"
                  className={`profile-phase-item ${coursePhase === 'inicial' ? 'selected' : ''}`}
                  onClick={() => setCoursePhase('inicial')}
                  role="radio"
                  aria-checked={coursePhase === 'inicial'}
                >
                  <span className="profile-phase-title">🟢 Fase Inicial</span>
                  <span className="profile-phase-desc">1º ao 3º período</span>
                </button>

                <button
                  type="button"
                  className={`profile-phase-item ${coursePhase === 'intermediaria' ? 'selected' : ''}`}
                  onClick={() => setCoursePhase('intermediaria')}
                  role="radio"
                  aria-checked={coursePhase === 'intermediaria'}
                >
                  <span className="profile-phase-title">🟡 Fase Intermediária</span>
                  <span className="profile-phase-desc">4º ao 6º período</span>
                </button>

                <button
                  type="button"
                  className={`profile-phase-item ${coursePhase === 'concluinte' ? 'selected' : ''}`}
                  onClick={() => setCoursePhase('concluinte')}
                  role="radio"
                  aria-checked={coursePhase === 'concluinte'}
                >
                  <span className="profile-phase-title">🔴 Concluinte</span>
                  <span className="profile-phase-desc">7º período+ / TCC / Estágio</span>
                </button>
              </div>
            </div>
          )}

          {/* Passo 2: Fase do Curso (se aluno de curso técnico) */}
          {profileType === 'aluno_tecnico' && (
            <div>
              <h3 className="profile-section-title">
                <span className="profile-step-number">2</span>
                Em qual etapa do curso técnico você está?
              </h3>
              <div className="profile-phases-list phases-two-cols" role="radiogroup" aria-label="Selecione a fase do curso">
                <button
                  type="button"
                  className={`profile-phase-item ${coursePhase === 'inicial' ? 'selected' : ''}`}
                  onClick={() => setCoursePhase('inicial')}
                  role="radio"
                  aria-checked={coursePhase === 'inicial'}
                >
                  <span className="profile-phase-title">🟢 Fase Inicial</span>
                  <span className="profile-phase-desc">1º ano / Módulos iniciais</span>
                </button>

                <button
                  type="button"
                  className={`profile-phase-item ${coursePhase === 'concluinte' ? 'selected' : ''}`}
                  onClick={() => setCoursePhase('concluinte')}
                  role="radio"
                  aria-checked={coursePhase === 'concluinte'}
                >
                  <span className="profile-phase-title">🔴 Concluinte</span>
                  <span className="profile-phase-desc">Último ano / Estágio</span>
                </button>
              </div>
            </div>
          )}

          {/* Mensagem para servidores */}
          {(profileType === 'docente' || profileType === 'tae') && (
            <div className="profile-server-notice">
              <span>✔️</span>
              <span>
                Perfil de <strong>{profileType === 'docente' ? 'Docente' : 'Técnico-Administrativo'}</strong> selecionado.
                Suas dúvidas e testes serão analisados sob a perspectiva do corpo de servidores.
              </span>
            </div>
          )}
        </form>

        {/* Rodapé com botão */}
        <div className="profile-modal-footer">
          {errorMessage && (
            <span className="profile-error-alert">{errorMessage}</span>
          )}
          <button
            type="button"
            className="profile-submit-btn"
            disabled={!isReadyToSubmit || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Salvando...' : 'Liberar Acesso ao Chat →'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ProfileModal;
