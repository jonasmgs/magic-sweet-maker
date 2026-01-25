/**
 * Contexto de Autenticação
 *
 * Gerencia estado de autenticação do usuário.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { authService, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateCredits: (credits: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Obter device ID único
  const getDeviceId = async (): Promise<string> => {
    let deviceId = await SecureStore.getItemAsync('deviceId');
    if (!deviceId) {
      // Gerar ID único baseado no dispositivo
      const androidId = Application.getAndroidId?.() || '';
      const iosId = await Application.getIosIdForVendorAsync?.() || '';
      deviceId = androidId || iosId || `${Device.modelName}-${Date.now()}`;
      await SecureStore.setItemAsync('deviceId', deviceId);
    }
    return deviceId;
  };

  // Verificar autenticação ao iniciar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        const response = await authService.me();
        if (response.success) {
          setUser(response.user);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      // Limpar tokens inválidos
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const deviceId = await getDeviceId();
      const response = await authService.login(email, password, deviceId);

      if (response.success) {
        await SecureStore.setItemAsync('accessToken', response.accessToken);
        await SecureStore.setItemAsync('refreshToken', response.refreshToken);
        setUser(response.user);
        return { success: true };
      }

      return { success: false, error: 'Erro ao fazer login' };
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao fazer login';
      return { success: false, error: message };
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      const deviceId = await getDeviceId();
      const response = await authService.register(email, password, name, deviceId);

      if (response.success) {
        await SecureStore.setItemAsync('accessToken', response.accessToken);
        await SecureStore.setItemAsync('refreshToken', response.refreshToken);
        setUser(response.user);
        return { success: true };
      }

      return { success: false, error: 'Erro ao criar conta' };
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao criar conta';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      await authService.logout(refreshToken || undefined);
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authService.me();
      if (response.success) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
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
