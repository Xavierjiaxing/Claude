import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { api } from '@/lib/api';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsAuthenticated(!!sessionStorage.getItem('auth_token'));
    setIsLoading(false);
  }, []);

  const login = useCallback(async (password: string) => {
    const data = await api.post<{ token: string }>('/api/auth/login', { password });
    sessionStorage.setItem('auth_token', data.token);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/api/auth/logout', {}); } catch { /* ignore */ }
    sessionStorage.removeItem('auth_token');
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
