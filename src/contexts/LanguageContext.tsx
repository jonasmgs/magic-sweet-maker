import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'pt' | 'en';
type Theme = 'feminine' | 'masculine';

interface Translations {
  title: string;
  subtitle: string;
  inputPlaceholder: string;
  buttonText: string;
  loadingText: string;
  suggestionsTitle: string;
  errorTitle: string;
  errorMessage: string;
  tryAgain: string;
  createAnother: string;
  recipeTitle: string;
  ingredientsTitle: string;
  stepsTitle: string;
  safetyWarning: string;
  blockedIngredient: string;
  popularIngredients: string;
  savedIngredients: string;
  saveIngredient: string;
  removeIngredient: string;
  themeLabel: string;
  feminineTheme: string;
  masculineTheme: string;
}

const translations: Record<Language, Translations> = {
  pt: {
    title: "Doce Mágico",
    subtitle: "Crie receitas deliciosas com a magia da IA! ✨",
    inputPlaceholder: "Digite os ingredientes do seu doce mágico 🍭 (ex: chocolate, morango, leite)",
    buttonText: "Criar Meu Doce! 🪄",
    loadingText: "Criando sua magia doce...",
    suggestionsTitle: "Ingredientes populares:",
    errorTitle: "Ops! Algo deu errado 😅",
    errorMessage: "Não conseguimos criar seu doce agora. Tente novamente!",
    tryAgain: "Tentar Novamente",
    createAnother: "Criar Outro Doce! 🍰",
    recipeTitle: "Receita Mágica",
    ingredientsTitle: "🧁 Ingredientes",
    stepsTitle: "👩‍🍳 Como Fazer",
    safetyWarning: "⚠️ Peça ajuda de um adulto para preparar essa receita! 👩‍🍳👨‍🍳",
    blockedIngredient: "Ops! Esse ingrediente não é comidinha 😅 Vamos escolher algo gostoso como chocolate, frutas ou leite?",
    popularIngredients: "Ingredientes populares:",
    savedIngredients: "Meus ingredientes:",
    saveIngredient: "Salvar ingrediente",
    removeIngredient: "Remover",
    themeLabel: "Tema:",
    feminineTheme: "🧁 Doces Fofos",
    masculineTheme: "🦸 Super-Heróis",
  },
  en: {
    title: "Sweet Magic",
    subtitle: "Create delicious recipes with AI magic! ✨",
    inputPlaceholder: "Type your magic sweet ingredients 🍭 (e.g., chocolate, strawberry, milk)",
    buttonText: "Create My Sweet! 🪄",
    loadingText: "Creating your sweet magic...",
    suggestionsTitle: "Popular ingredients:",
    errorTitle: "Oops! Something went wrong 😅",
    errorMessage: "We couldn't create your sweet right now. Try again!",
    tryAgain: "Try Again",
    createAnother: "Create Another Sweet! 🍰",
    recipeTitle: "Magic Recipe",
    ingredientsTitle: "🧁 Ingredients",
    stepsTitle: "👩‍🍳 How to Make",
    safetyWarning: "⚠️ Ask an adult for help to prepare this recipe! 👩‍🍳👨‍🍳",
    blockedIngredient: "Oops! That ingredient isn't food 😅 Let's choose something yummy like chocolate, fruits, or milk!",
    popularIngredients: "Popular ingredients:",
    savedIngredients: "My ingredients:",
    saveIngredient: "Save ingredient",
    removeIngredient: "Remove",
    themeLabel: "Theme:",
    feminineTheme: "🧁 Cute Sweets",
    masculineTheme: "🦸 Superheroes",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: Translations;
  savedIngredients: string[];
  saveIngredient: (ingredient: string) => void;
  removeIngredient: (ingredient: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const SAVED_INGREDIENTS_KEY = 'sweet-magic-saved-ingredients';
const THEME_KEY = 'sweet-magic-theme';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('feminine');
  const [savedIngredients, setSavedIngredients] = useState<string[]>([]);

  // Load saved ingredients and theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SAVED_INGREDIENTS_KEY);
    if (saved) {
      setSavedIngredients(JSON.parse(saved));
    }
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const saveIngredient = (ingredient: string) => {
    const cleaned = ingredient.trim().toLowerCase();
    if (cleaned && !savedIngredients.includes(cleaned)) {
      const updated = [...savedIngredients, cleaned];
      setSavedIngredients(updated);
      localStorage.setItem(SAVED_INGREDIENTS_KEY, JSON.stringify(updated));
    }
  };

  const removeIngredient = (ingredient: string) => {
    const updated = savedIngredients.filter(i => i !== ingredient);
    setSavedIngredients(updated);
    localStorage.setItem(SAVED_INGREDIENTS_KEY, JSON.stringify(updated));
  };

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  };

  const value = {
    language,
    setLanguage,
    theme,
    setTheme: handleSetTheme,
    t: translations[language],
    savedIngredients,
    saveIngredient,
    removeIngredient,
  };

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
