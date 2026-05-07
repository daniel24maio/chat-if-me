import { useTheme } from '../../contexts/ThemeContext';
import './ThemeToggle.styles.css';

/**
 * Botão de troca de tema (light ↔ dark).
 *
 * Exibe um ícone de sol (☀️) no modo escuro e lua (🌙) no modo claro,
 * com uma micro-animação de rotação na transição.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      id="theme-toggle-btn"
    >
      <span className={`theme-icon ${theme === 'light' ? 'icon-visible' : 'icon-hidden'}`}>
        🌙
      </span>
      <span className={`theme-icon ${theme === 'dark' ? 'icon-visible' : 'icon-hidden'}`}>
        ☀️
      </span>
    </button>
  );
}
