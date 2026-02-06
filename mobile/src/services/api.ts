/**
 * API Service
 *
 * Handles all backend calls.
 */

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { supabase } from './supabase';

// Backend URL (configurable via app.json -> extra.apiUrl)
const getApiUrl = () => {
  const extraApiUrl =
    Constants.expoConfig?.extra?.apiUrl ||
    (Constants as any).manifest?.extra?.apiUrl ||
    (Constants as any).manifest2?.extra?.apiUrl;

  if (typeof extraApiUrl === 'string' && extraApiUrl.trim().length > 0) {
    const trimmed = extraApiUrl.trim().replace(/\/+$/, '');
    const withScheme = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;

    // Most backend routes are mounted under /api. If the user config forgets it,
    // the app gets stuck on auth (backend profile fetch 404/401).
    if (/\/api(\/|$)/i.test(withScheme)) {
      return withScheme;
    }

    return `${withScheme}/api`;
  }

  return 'https://magic-sweet-maker-1.onrender.com/api';
};

const API_URL = getApiUrl();

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let cachedDeviceId: string | null = null;

const getDeviceId = async (): Promise<string> => {
  if (cachedDeviceId) return cachedDeviceId;

  let deviceId = await SecureStore.getItemAsync('deviceId');
  if (!deviceId) {
    const androidId = Application.getAndroidId?.() || '';
    const iosId = await Application.getIosIdForVendorAsync?.() || '';
    deviceId = androidId || iosId || `${Device.modelName}-${Date.now()}`;
    await SecureStore.setItemAsync('deviceId', deviceId);
  }

  cachedDeviceId = deviceId;
  return deviceId;
};

// Add Supabase access token + device id
api.interceptors.request.use(
  async (config) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    const deviceId = await getDeviceId();
    if (deviceId) {
      config.headers = config.headers || {};
      config.headers['x-device-id'] = deviceId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Types
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

export interface GenerateResponse {
  success: boolean;
  recipe: Recipe;
  fromCache?: boolean;
}

// Auth endpoints (backend profile)
export const authService = {
  async me(): Promise<{ success: boolean; user?: User; error?: string }> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};

// Desserts
export const dessertService = {
  async generate(
    ingredients: string,
    theme: 'feminine' | 'masculine' = 'feminine',
    language: 'pt' | 'en' | 'es' | 'fr' | 'de' | 'ja' = 'pt'
  ): Promise<GenerateResponse> {
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

// User endpoints
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

  async createCheckoutSession() {
    const response = await api.post('/users/upgrade/checkout');
    return response.data;
  },

  async updateProfile(name: string) {
    const response = await api.put('/users/profile', { name });
    return response.data;
  },
};

export default api;
