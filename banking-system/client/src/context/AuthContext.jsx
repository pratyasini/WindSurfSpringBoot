import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useApolloClient } from '@apollo/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const client = useApolloClient();
  const [token, setToken] = useState(() => localStorage.getItem('bank_token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('bank_user');
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem('bank_token', newToken);
    localStorage.setItem('bank_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bank_token');
    localStorage.removeItem('bank_user');
    setToken(null);
    setUser(null);
    client.clearStore();
  }, [client]);

  const value = useMemo(
    () => ({ token, user, isAuthenticated: Boolean(token), login, logout }),
    [token, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
