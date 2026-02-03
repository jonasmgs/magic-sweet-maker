/**
 * Contexto de Idioma
 *
 * Gerencia idioma e tema da aplicação.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Localization from 'expo-localization';

type Language = 'pt' | 'en' | 'es' | 'fr' | 'de';
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
  settingsTitle: string;
  languageLabel: string;
  themeLabel: string;
  themeSweets: string;
  themeHeroes: string;
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
  upgradeTitle: string;
  upgradeMessage: string;
  cancel: string;
  confirm: string;
  paymentError: string;
  logout: string;
  logoutQuestion: string;
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
    settingsTitle: '⚙️ Configurações',
    languageLabel: 'Idioma',
    themeLabel: 'Tema',
    themeSweets: 'Doces',
    themeHeroes: 'Heróis',
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
    upgradeTitle: 'Fazer Upgrade',
    upgradeMessage: 'Deseja fazer upgrade para o plano Premium? Você será levado ao pagamento.',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    paymentError: 'Não foi possível iniciar o pagamento',
    logout: 'Sair',
    logoutQuestion: 'Deseja sair da conta?',
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
    settingsTitle: '⚙️ Settings',
    languageLabel: 'Language',
    themeLabel: 'Theme',
    themeSweets: 'Sweets',
    themeHeroes: 'Heroes',
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
    upgradeTitle: 'Upgrade',
    upgradeMessage: 'Do you want to upgrade to Premium plan? You will be redirected to payment.',
    cancel: 'Cancel',
    confirm: 'Confirm',
    paymentError: 'Unable to start payment',
    logout: 'Logout',
    logoutQuestion: 'Do you want to logout?',
    history: 'History',
    home: 'Home',
    creditsLeft: 'credits left',
    noCredits: 'Magic credits ran out!',
    askAdult: 'Ask an adult to add more credits!',
  },
  es: {
    title: 'Dulce Mágico',
    subtitle: '¡Crea recetas deliciosas con magia de IA! ✨',
    inputPlaceholder: 'Escribe ingredientes (ej: chocolate, fresa)',
    buttonText: '¡Crear mi dulce! 🪄',
    loadingText: 'Creando tu magia dulce...',
    errorTitle: '¡Ups! Algo salió mal 😅',
    errorMessage: 'No pudimos crear tu dulce ahora. ¡Intenta de nuevo!',
    tryAgain: 'Intentar de nuevo',
    createAnother: '¡Crear otro dulce! 🍰',
    recipeTitle: 'Receta mágica',
    ingredientsTitle: '🧁 Ingredientes',
    stepsTitle: '👩‍🍳 Cómo preparar',
    safetyWarning: '⚠️ ¡Pide ayuda a un adulto para preparar!',
    settingsTitle: '⚙️ Configuración',
    languageLabel: 'Idioma',
    themeLabel: 'Tema',
    themeSweets: 'Dulces',
    themeHeroes: 'Héroes',
    login: 'Iniciar sesión',
    register: 'Crear cuenta',
    email: 'Correo',
    password: 'Contraseña',
    name: 'Nombre',
    noAccount: '¿No tienes cuenta? Regístrate',
    haveAccount: '¿Ya tienes cuenta? Entra',
    profile: 'Perfil',
    credits: 'Créditos',
    plan: 'Plan',
    premium: 'Premium',
    free: 'Gratis',
    upgrade: 'Mejorar',
    upgradeTitle: 'Mejorar',
    upgradeMessage: '¿Deseas mejorar al plan Premium? Serás redirigido al pago.',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    paymentError: 'No se pudo iniciar el pago',
    logout: 'Salir',
    logoutQuestion: '¿Deseas cerrar sesión?',
    history: 'Historial',
    home: 'Inicio',
    creditsLeft: 'créditos restantes',
    noCredits: '¡Se acabaron los créditos mágicos!',
    askAdult: '¡Pide a un adulto que agregue más créditos!',
  },
  fr: {
    title: 'Douceur Magique',
    subtitle: 'Crée des recettes délicieuses avec la magie de l’IA ! ✨',
    inputPlaceholder: 'Saisis des ingrédients (ex : chocolat, fraise)',
    buttonText: 'Créer ma douceur ! 🪄',
    loadingText: 'Création de ta magie sucrée...',
    errorTitle: 'Oups ! Quelque chose a mal tourné 😅',
    errorMessage: 'Impossible de créer ta douceur maintenant. Réessaie !',
    tryAgain: 'Réessayer',
    createAnother: 'Créer une autre douceur ! 🍰',
    recipeTitle: 'Recette magique',
    ingredientsTitle: '🧁 Ingrédients',
    stepsTitle: '👩‍🍳 Préparation',
    safetyWarning: '⚠️ Demande l’aide d’un adulte pour préparer !',
    settingsTitle: '⚙️ Paramètres',
    languageLabel: 'Langue',
    themeLabel: 'Thème',
    themeSweets: 'Douceurs',
    themeHeroes: 'Héros',
    login: 'Connexion',
    register: 'Créer un compte',
    email: 'Email',
    password: 'Mot de passe',
    name: 'Nom',
    noAccount: 'Pas de compte ? Inscris-toi',
    haveAccount: 'Déjà un compte ? Connecte-toi',
    profile: 'Profil',
    credits: 'Crédits',
    plan: 'Forfait',
    premium: 'Premium',
    free: 'Gratuit',
    upgrade: 'Passer Premium',
    upgradeTitle: 'Passer Premium',
    upgradeMessage: 'Souhaitez-vous passer au plan Premium ? Vous serez redirigé vers le paiement.',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    paymentError: 'Impossible de démarrer le paiement',
    logout: 'Se déconnecter',
    logoutQuestion: 'Voulez-vous vous déconnecter ?',
    history: 'Historique',
    home: 'Accueil',
    creditsLeft: 'crédits restants',
    noCredits: 'Les crédits magiques sont épuisés !',
    askAdult: 'Demande à un adulte d’ajouter des crédits !',
  },
  de: {
    title: 'Magische Süße',
    subtitle: 'Erstelle leckere Rezepte mit KI-Magie! ✨',
    inputPlaceholder: 'Zutaten eingeben (z. B. Schokolade, Erdbeere)',
    buttonText: 'Meine Süßigkeit erstellen! 🪄',
    loadingText: 'Deine süße Magie entsteht...',
    errorTitle: 'Hoppla! Etwas ist schiefgelaufen 😅',
    errorMessage: 'Wir konnten deine Süßigkeit gerade nicht erstellen. Versuch es erneut!',
    tryAgain: 'Erneut versuchen',
    createAnother: 'Noch eine Süßigkeit! 🍰',
    recipeTitle: 'Magisches Rezept',
    ingredientsTitle: '🧁 Zutaten',
    stepsTitle: '👩‍🍳 Zubereitung',
    safetyWarning: '⚠️ Bitte einen Erwachsenen um Hilfe beim Zubereiten!',
    settingsTitle: '⚙️ Einstellungen',
    languageLabel: 'Sprache',
    themeLabel: 'Thema',
    themeSweets: 'Süßes',
    themeHeroes: 'Helden',
    login: 'Anmelden',
    register: 'Konto erstellen',
    email: 'E-Mail',
    password: 'Passwort',
    name: 'Name',
    noAccount: 'Kein Konto? Registrieren',
    haveAccount: 'Schon ein Konto? Anmelden',
    profile: 'Profil',
    credits: 'Credits',
    plan: 'Plan',
    premium: 'Premium',
    free: 'Kostenlos',
    upgrade: 'Upgrade',
    upgradeTitle: 'Upgrade',
    upgradeMessage: 'Möchtest du auf Premium upgraden? Du wirst zur Zahlung weitergeleitet.',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    paymentError: 'Zahlung konnte nicht gestartet werden',
    logout: 'Abmelden',
    logoutQuestion: 'Möchtest du dich abmelden?',
    history: 'Verlauf',
    home: 'Start',
    creditsLeft: 'Credits übrig',
    noCredits: 'Die magischen Credits sind aufgebraucht!',
    askAdult: 'Bitte einen Erwachsenen, mehr Credits hinzuzufügen!',
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
  const supportedLanguages: Language[] = ['pt', 'en', 'es', 'fr', 'de'];

  const resolveDeviceLanguage = (): Language => {
    const locale = Localization.locale || 'en';
    const languageCode = locale.split('-')[0];
    if (supportedLanguages.includes(languageCode as Language)) {
      return languageCode as Language;
    }
    return 'en';
  };

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
      if (savedLang && supportedLanguages.includes(savedLang as Language)) {
        setLanguageState(savedLang as Language);
      } else if (!savedLang) {
        setLanguageState(resolveDeviceLanguage());
      }
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
