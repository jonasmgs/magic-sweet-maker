/**
 * Auth context
 *
 * Uses Supabase session and backend profile (/auth/me).
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, User } from '../services/api';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (idToken: string) => Promise<{ success: boolean; error?: string }>;
  loginWithApple: (idToken: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateCredits: (credits: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadBackendUser = async (): Promise<User | null> => {
    try {
      const response = await authService.me();
      if (response.success && response.user) {
        setUser(response.user);
        return response.user;
      } else {
        setUser(null);
        return null;
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        setUser(null);
        await supabase.auth.signOut();
        return null;
      } else {
        console.error('Erro ao buscar usuario:', error);
        setUser(null);
        return null;
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          await loadBackendUser();
        } else {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: unknown, session: any) => {
      if (!isMounted) return;

      if (session) {
        await loadBackendUser();
      } else {
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async () => {
    return { success: false, error: 'Login por email/senha desativado. Use Google ou Apple.' };
  };

  const register = async () => {
    return { success: false, error: 'Cadastro desativado. Use Google ou Apple.' };
  };

  const loginWithGoogle = async (idToken: string) => {
    try {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const backendUser = await loadBackendUser();
      if (!backendUser) {
        return { success: false, error: 'Login ok, mas falhou ao carregar perfil no backend. Verifique apiUrl e SUPABASE_JWT_SECRET.' };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error);
      return { success: false, error: 'Erro ao fazer login com Google' };
    }
  };

  const loginWithApple = async (idToken: string) => {
    try {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: idToken,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const backendUser = await loadBackendUser();
      if (!backendUser) {
        return { success: false, error: 'Login ok, mas falhou ao carregar perfil no backend. Verifique apiUrl e SUPABASE_JWT_SECRET.' };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao fazer login com Apple:', error);
      return { success: false, error: 'Erro ao fazer login com Apple' };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      await supabase.auth.signOut();
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await loadBackendUser();
  };

  const updateCredits = (credits: number) => {
    if (user) {
      setUser({ ...user, credits });
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    loginWithGoogle,
    loginWithApple,
    logout,
    refreshUser,
    updateCredits,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
