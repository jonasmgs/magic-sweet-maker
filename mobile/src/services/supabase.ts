import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const getExtraValue = (key: string) => {
  return (
    Constants.expoConfig?.extra?.[key] ||
    (Constants as any).manifest?.extra?.[key] ||
    (Constants as any).manifest2?.extra?.[key]
  );
};

const supabaseUrl = getExtraValue('supabaseUrl');
const supabaseAnonKey = getExtraValue('supabaseAnonKey');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase config missing. Set supabaseUrl and supabaseAnonKey in app.json extra.');
}

const SupabaseSecureStore = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: SupabaseSecureStore,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
