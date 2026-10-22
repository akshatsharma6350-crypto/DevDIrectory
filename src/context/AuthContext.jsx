import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('dd_user'));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);

  const login = useCallback((userPayload) => {
    const { token, ...profile } = userPayload;
    setUser(profile);
    localStorage.setItem('dd_user', JSON.stringify(profile));
    if (token) localStorage.setItem('dd_token', token);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('dd_user');
    localStorage.removeItem('dd_token');
  }, []);

  const value = useMemo(() => ({ user, isAuthenticated: Boolean(user), login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
