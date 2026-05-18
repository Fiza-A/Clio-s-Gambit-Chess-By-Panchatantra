import React, { createContext, useContext, useMemo, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { authApi } from '../api/authApi.js';

const AuthContext = createContext(null);
const storageKey = 'cbp-auth';

export function AuthProvider({ children }) {
  const toast = useToast();
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || { token: null, user: null };
    } catch {
      return { token: null, user: null };
    }
  });

  const login = async (payload) => {
    const next = await authApi.login(payload);
    setSession(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    toast({ title: `Logged in as ${next.user.name}`, status: 'success', duration: 2200 });
    return next.user;
  };

  const register = async (payload) => {
    const next = await authApi.register(payload);
    setSession(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    toast({ title: 'Account created', status: 'success', duration: 2200 });
    return next.user;
  };

  const logout = async () => {
    await authApi.logout();
    setSession({ token: null, user: null });
    localStorage.removeItem(storageKey);
    toast({ title: 'Logged out', status: 'info', duration: 1800 });
  };

  const value = useMemo(() => ({ ...session, login, register, logout, isAuthenticated: Boolean(session.user) }), [session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
