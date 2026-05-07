import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Contexto global de tema (light / dark).
 *
 * Fluxo:
 *   1. Na primeira visita, herda a preferência do sistema operacional
 *   2. A escolha do usuário é persistida em localStorage ('chatifme-theme')
 *   3. Aplica o atributo `data-theme` no <html>, permitindo que o CSS
 *      selecione as variáveis corretas via `[data-theme="dark"]`
 */

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'chatifme-theme';

/**
 * Detecta a preferência de tema do sistema operacional.
 */
function getSystemPreference(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

/**
 * Recupera o tema salvo no localStorage, ou retorna a preferência do SO.
 */
function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  }
  return getSystemPreference();
}

/**
 * Provider de tema — envolve toda a aplicação.
 *
 * Responsável por:
 *   - Manter o estado do tema ('light' | 'dark')
 *   - Persistir a escolha em localStorage
 *   - Aplicar/remover o atributo `data-theme` no <html>
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Aplica o atributo data-theme sempre que o tema mudar
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook para consumir o contexto de tema em qualquer componente.
 *
 * @example
 * const { theme, toggleTheme } = useTheme();
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um <ThemeProvider>');
  }
  return context;
}
