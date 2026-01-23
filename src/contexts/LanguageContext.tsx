import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'pt' | 'en';

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
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('pt');

  const value = {
    language,
    setLanguage,
    t: translations[language],
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
