import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('studentvault_user');
    const token = sessionStorage.getItem('studentvault_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    sessionStorage.setItem('studentvault_token', data.token);
    sessionStorage.setItem('studentvault_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    sessionStorage.setItem('studentvault_token', data.token);
    sessionStorage.setItem('studentvault_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    sessionStorage.removeItem('studentvault_token');
    sessionStorage.removeItem('studentvault_user');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { data } = await authAPI.getMe();
      const updated = { ...user, ...data };
      sessionStorage.setItem('studentvault_user', JSON.stringify(updated));
      setUser(updated);
      return updated;
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
