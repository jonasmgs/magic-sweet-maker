/**
 * Contexto de Idioma e Tema
 *
 * Gerencia idioma (12 idiomas suportados) e tema da aplicação.
 * Suporta RTL (right-to-left) para árabe.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { I18nManager } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Localization from 'expo-localization';
import {
  Language,
  Translations,
  translations,
  SUPPORTED_LANGUAGES,
  isRTL,
} from '../i18n/translations';

export type Theme = 'feminine' | 'masculine';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  t: Translations;
  isRtl: boolean;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Detecta o idioma do dispositivo e retorna o mais próximo suportado
 */
function detectDeviceLanguage(): Language {
  try {
    const deviceLocale = Localization.locale?.split('-')[0]?.toLowerCase();
    const supportedCodes = SUPPORTED_LANGUAGES.map(l => l.code);

    if (deviceLocale && supportedCodes.includes(deviceLocale as Language)) {
      return deviceLocale as Language;
    }

    // Fallback para inglês
    return 'en';
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [theme, setThemeState] = useState<Theme>('feminine');
  const [isInitialized, setIsInitialized] = useState(false);

  // Carregar preferências salvas na inicialização
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const [savedLang, savedTheme] = await Promise.all([
        SecureStore.getItemAsync('language'),
        SecureStore.getItemAsync('theme'),
      ]);

      if (savedLang && SUPPORTED_LANGUAGES.some(l => l.code === savedLang)) {
        setLanguageState(savedLang as Language);
        updateRTL(savedLang as Language);
      } else {
        // Detectar idioma do dispositivo na primeira execução
        const detectedLang = detectDeviceLanguage();
        setLanguageState(detectedLang);
        updateRTL(detectedLang);
      }

      if (savedTheme === 'feminine' || savedTheme === 'masculine') {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
    } finally {
      setIsInitialized(true);
    }
  };

  const updateRTL = (lang: Language) => {
    const shouldBeRTL = isRTL(lang);
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);
      // Nota: Mudança de RTL requer reinício do app
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      updateRTL(lang);
      await SecureStore.setItemAsync('language', lang);
    } catch (error) {
      console.error('Erro ao salvar idioma:', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      await SecureStore.setItemAsync('theme', newTheme);
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    theme,
    setTheme,
    t: translations[language],
    isRtl: isRTL(language),
    supportedLanguages: SUPPORTED_LANGUAGES,
  };

  // Aguardar inicialização para evitar flash de idioma errado
  if (!isInitialized) {
    return null;
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Re-exportar tipos úteis
export type { Language, Translations };
export { SUPPORTED_LANGUAGES, translations };
