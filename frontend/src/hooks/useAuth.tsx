import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser, Role } from '../types';
import { authService } from '../services';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('suvms_token');
    const storedUser = localStorage.getItem('suvms_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authService.login(email, password);
    localStorage.setItem('suvms_token', data.token);
    localStorage.setItem('suvms_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('suvms_token');
    localStorage.removeItem('suvms_user');
    setToken(null);
    setUser(null);
  }, []);

  const isRole = useCallback((role: Role) => user?.role === role, [user]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
