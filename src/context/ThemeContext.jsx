import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

/** Dark / light mode. Sets BOTH `data-theme` (our CSS variables) and the `dark`
 *  class on <html> (so Tailwind's `darkMode: 'class'` utilities work too).
 *  The choice is remembered in localStorage. */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('dd_theme') || 'dark');

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('dd_theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#f4f3f0');
  }, [theme]);

  const value = useMemo(() => ({ theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
