import React, { useEffect, useRef } from 'react';
import './FeedbackFormModal.styles.css';

interface FeedbackFormModalProps {
  isOpen: boolean;
  /** URL do formulário Google de feedback */
  formUrl: string;
  onClose: () => void;
}

/**
 * Modal de agradecimento exibido após algumas interações com o chat.
 * Convida o participante a responder o formulário de feedback em uma nova aba,
 * sem bloquear o uso do chat.
 */
export const FeedbackFormModal: React.FC<FeedbackFormModalProps> = ({
  isOpen,
  formUrl,
  onClose,
}) => {
  const primaryBtnRef = useRef<HTMLAnchorElement>(null);

  // Fecha com Esc e coloca o foco no botão principal ao abrir
  useEffect(() => {
    if (!isOpen) return;
    primaryBtnRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="feedback-modal-overlay" onClick={onClose}>
      <div
        className="feedback-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        aria-describedby="feedback-modal-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="feedback-modal-close"
          type="button"
          className="feedback-modal-close"
          onClick={onClose}
          aria-label="Fechar e continuar no chat"
        >
          ✕
        </button>

        <span className="feedback-modal-icon" aria-hidden="true">🎉</span>
        <h2 id="feedback-modal-title" className="feedback-modal-title">
          Obrigado por participar do teste!
        </h2>
        <p id="feedback-modal-desc" className="feedback-modal-text">
          Suas perguntas ajudam a avaliar o assistente. Para concluir sua participação,
          responda a um formulário rápido de feedback.
        </p>
        <p className="feedback-modal-hint">
          O formulário abre em uma nova aba. Depois, você pode voltar para esta aba e
          continuar fazendo perguntas.
        </p>

        <div className="feedback-modal-actions">
          <a
            ref={primaryBtnRef}
            id="feedback-modal-form-link"
            className="feedback-modal-primary"
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
          >
            📝 Responder formulário ↗
          </a>
          <button
            id="feedback-modal-continue"
            type="button"
            className="feedback-modal-secondary"
            onClick={onClose}
          >
            Continuar no chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackFormModal;
