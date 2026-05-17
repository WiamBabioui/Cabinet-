import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token     = localStorage.getItem('cabinet_token');
    const savedUser = localStorage.getItem('cabinet_user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('cabinet_token');
          localStorage.removeItem('cabinet_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, mot_de_passe) => {
    const res = await api.post('/auth/login', { email, mot_de_passe });
    const { token, user } = res.data;
    localStorage.setItem('cabinet_token', token);
    localStorage.setItem('cabinet_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const signup = async (data) => {
    const res = await api.post('/auth/signup', data);
    const { token, user } = res.data;
    localStorage.setItem('cabinet_token', token);
    localStorage.setItem('cabinet_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('cabinet_token');
    localStorage.removeItem('cabinet_user');
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser((current) => {
      const next = { ...current, ...updates };
      localStorage.setItem('cabinet_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
