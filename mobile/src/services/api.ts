/**
 * Serviço de API
 *
 * Gerencia todas as chamadas à API do backend.
 */

import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

// URL do backend (alterar em produção)
const API_URL = 'http://localhost:3000/api';

// Criar instância do axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar erros e refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Se token expirou, tenta refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;

          await SecureStore.setItemAsync('accessToken', accessToken);
          await SecureStore.setItemAsync('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Limpar tokens se refresh falhar
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }

    return Promise.reject(error);
  }
);

// Tipos
export interface User {
  id: number;
  email: string;
  name: string | null;
  plan: 'free' | 'premium';
  credits: number;
  created_at: string;
}

export interface Recipe {
  name: string;
  image: string;
  ingredients: string[];
  steps: string[];
}

export interface AuthResponse {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface GenerateResponse {
  success: boolean;
  recipe: Recipe;
  fromCache?: boolean;
}

// Funções de autenticação
export const authService = {
  async register(email: string, password: string, name?: string, deviceId?: string): Promise<AuthResponse> {
    const response = await api.post('/auth/register', { email, password, name, deviceId });
    return response.data;
  },

  async login(email: string, password: string, deviceId?: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password, deviceId });
    return response.data;
  },

  async me(): Promise<{ success: boolean; user: User }> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async logout(refreshToken?: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken });
  },
};

// Funções de sobremesas
export const dessertService = {
  async generate(ingredients: string, theme: 'feminine' | 'masculine' = 'feminine', language: 'pt' | 'en' = 'pt'): Promise<GenerateResponse> {
    const response = await api.post('/desserts/generate', { ingredients, theme, language });
    return response.data;
  },

  async getHistory(limit = 20, offset = 0) {
    const response = await api.get('/desserts/history', { params: { limit, offset } });
    return response.data;
  },

  async getById(id: number) {
    const response = await api.get(`/desserts/${id}`);
    return response.data;
  },

  async delete(id: number) {
    const response = await api.delete(`/desserts/${id}`);
    return response.data;
  },
};

// Funções de usuário
export const userService = {
  async getProfile() {
    const response = await api.get('/users/profile');
    return response.data;
  },

  async getCredits() {
    const response = await api.get('/users/credits');
    return response.data;
  },

  async upgrade(paymentToken?: string) {
    const response = await api.post('/users/upgrade', { paymentToken });
    return response.data;
  },

  async updateProfile(name: string) {
    const response = await api.put('/users/profile', { name });
    return response.data;
  },
};

export default api;
