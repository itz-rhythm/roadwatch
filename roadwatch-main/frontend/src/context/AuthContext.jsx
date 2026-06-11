/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('roadwatch_token') || null;
    } catch {
      try {
        localStorage.removeItem('roadwatch_token');
        localStorage.removeItem('roadwatch_user');
      } catch {
        // ignore storage access errors
      }
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('roadwatch_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      try {
        localStorage.removeItem('roadwatch_token');
        localStorage.removeItem('roadwatch_user');
      } catch {
        // ignore storage access errors
      }
      return null;
    }
  });

  const [loading] = useState(false);

  const login = async (email, phone, password) => {
    const response = await api.post('/auth/login', { email, phone, password });
    const { token: newToken, user: newUser } = response.data;
    localStorage.setItem('roadwatch_token', newToken);
    localStorage.setItem('roadwatch_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const register = async (name, email, phone, password, role) => {
    const response = await api.post('/auth/register', { name, email, phone, password, role });
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('roadwatch_token');
    localStorage.removeItem('roadwatch_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
