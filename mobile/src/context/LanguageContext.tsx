/**
 * Contexto de Idioma
 *
 * Gerencia idioma e tema da aplicação.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

type Language = 'pt' | 'en';
type Theme = 'feminine' | 'masculine';

interface Translations {
  title: string;
  subtitle: string;
  inputPlaceholder: string;
  buttonText: string;
  loadingText: string;
  errorTitle: string;
  errorMessage: string;
  tryAgain: string;
  createAnother: string;
  recipeTitle: string;
  ingredientsTitle: string;
  stepsTitle: string;
  safetyWarning: string;
  login: string;
  register: string;
  email: string;
  password: string;
  name: string;
  noAccount: string;
  haveAccount: string;
  profile: string;
  credits: string;
  plan: string;
  premium: string;
  free: string;
  upgrade: string;
  logout: string;
  history: string;
  home: string;
  creditsLeft: string;
  noCredits: string;
  askAdult: string;
}

const translations: Record<Language, Translations> = {
  pt: {
    title: 'Doce Mágico',
    subtitle: 'Crie receitas deliciosas com a magia da IA! ✨',
    inputPlaceholder: 'Digite os ingredientes (ex: chocolate, morango)',
    buttonText: 'Criar Meu Doce! 🪄',
    loadingText: 'Criando sua magia doce...',
    errorTitle: 'Ops! Algo deu errado 😅',
    errorMessage: 'Não conseguimos criar seu doce agora. Tente novamente!',
    tryAgain: 'Tentar Novamente',
    createAnother: 'Criar Outro Doce! 🍰',
    recipeTitle: 'Receita Mágica',
    ingredientsTitle: '🧁 Ingredientes',
    stepsTitle: '👩‍🍳 Como Fazer',
    safetyWarning: '⚠️ Peça ajuda de um adulto para preparar!',
    login: 'Entrar',
    register: 'Criar Conta',
    email: 'Email',
    password: 'Senha',
    name: 'Nome',
    noAccount: 'Não tem conta? Cadastre-se',
    haveAccount: 'Já tem conta? Entre',
    profile: 'Perfil',
    credits: 'Créditos',
    plan: 'Plano',
    premium: 'Premium',
    free: 'Grátis',
    upgrade: 'Fazer Upgrade',
    logout: 'Sair',
    history: 'Histórico',
    home: 'Início',
    creditsLeft: 'créditos restantes',
    noCredits: 'Os créditos mágicos acabaram!',
    askAdult: 'Peça para um adulto carregar mais créditos!',
  },
  en: {
    title: 'Sweet Magic',
    subtitle: 'Create delicious recipes with AI magic! ✨',
    inputPlaceholder: 'Type ingredients (e.g., chocolate, strawberry)',
    buttonText: 'Create My Sweet! 🪄',
    loadingText: 'Creating your sweet magic...',
    errorTitle: 'Oops! Something went wrong 😅',
    errorMessage: "We couldn't create your sweet right now. Try again!",
    tryAgain: 'Try Again',
    createAnother: 'Create Another Sweet! 🍰',
    recipeTitle: 'Magic Recipe',
    ingredientsTitle: '🧁 Ingredients',
    stepsTitle: '👩‍🍳 How to Make',
    safetyWarning: '⚠️ Ask an adult for help to prepare!',
    login: 'Login',
    register: 'Sign Up',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    noAccount: "Don't have an account? Sign up",
    haveAccount: 'Already have an account? Log in',
    profile: 'Profile',
    credits: 'Credits',
    plan: 'Plan',
    premium: 'Premium',
    free: 'Free',
    upgrade: 'Upgrade',
    logout: 'Logout',
    history: 'History',
    home: 'Home',
    creditsLeft: 'credits left',
    noCredits: 'Magic credits ran out!',
    askAdult: 'Ask an adult to add more credits!',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('pt');
  const [theme, setThemeState] = useState<Theme>('feminine');

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await SecureStore.setItemAsync('language', lang);
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    await SecureStore.setItemAsync('theme', newTheme);
  };

  // Carregar preferências salvas
  React.useEffect(() => {
    (async () => {
      const savedLang = await SecureStore.getItemAsync('language');
      const savedTheme = await SecureStore.getItemAsync('theme');
      if (savedLang) setLanguageState(savedLang as Language);
      if (savedTheme) setThemeState(savedTheme as Theme);
    })();
  }, []);

  const value = {
    language,
    setLanguage,
    theme,
    setTheme,
    t: translations[language],
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
