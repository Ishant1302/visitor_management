import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('suvms_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('suvms_token', data.token);
    localStorage.setItem('suvms_user',  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (payload) => {
    const { data } = await api.post('/auth/signup', payload);
    localStorage.setItem('suvms_token', data.token);
    localStorage.setItem('suvms_user',  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('suvms_token');
    localStorage.removeItem('suvms_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
