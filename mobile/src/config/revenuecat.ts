/**
 * Configuração do RevenueCat
 *
 * Guarde as API Keys em variáveis de ambiente em produção!
 * Estas são chaves de exemplo - substitua pelas suas no RevenueCat Dashboard.
 */

import { Platform } from 'react-native';

// ==========================================
// 🔑 API KEYS - CONFIGURE NO REVENUECAT DASHBOARD
// ==========================================
// Sandbox/Desenvolvimento (usar em development)
const REVENUECAT_API_KEY_IOS_DEV = 'appl_YOUR_DEV_IOS_API_KEY';
const REVENUECAT_API_KEY_ANDROID_DEV = 'goog_YOUR_DEV_ANDROID_API_KEY';

// Produção (usar em production builds)
const REVENUECAT_API_KEY_IOS_PROD = 'appl_YOUR_PROD_IOS_API_KEY';
const REVENUECAT_API_KEY_ANDROID_PROD = 'goog_YOUR_PROD_ANDROID_API_KEY';

// Detectar ambiente (Expo define __DEV__ automaticamente)
const isDevelopment = __DEV__;

// ==========================================
// 📦 CONFIGURAÇÃO DOS PRODUTOS
// ==========================================
export const REVENUECAT_CONFIG = {
  // API Key baseada na plataforma e ambiente
  apiKey: Platform.select({
    ios: isDevelopment ? REVENUECAT_API_KEY_IOS_DEV : REVENUECAT_API_KEY_IOS_PROD,
    android: isDevelopment ? REVENUECAT_API_KEY_ANDROID_DEV : REVENUECAT_API_KEY_ANDROID_PROD,
    default: REVENUECAT_API_KEY_ANDROID_DEV,
  }),

  // Identificador do Entitlement principal
  entitlementId: 'premium',

  // Identificadores dos produtos (devem corresponder ao App Store Connect / Google Play Console)
  products: {
    candyCandy: {
      id: Platform.select({
        ios: 'com.magicsweetmaker.candycandy.monthly',
        android: 'candycandy_monthly',
        default: 'candycandy_monthly',
      }),
      name: 'CandyCandy',
      monthlyLimit: 150,
      priceUSD: 9.99,
    },
    candyCandyBasic: {
      id: Platform.select({
        ios: 'com.magicsweetmaker.candycandybasic.monthly',
        android: 'candycandybasic_monthly',
        default: 'candycandybasic_monthly',
      }),
      name: 'CandyCandy Basic',
      monthlyLimit: 60,
      priceUSD: 4.99,
    },
  },

  // Identificador do Offering padrão
  defaultOfferingId: 'default',
};

// ==========================================
// 📋 PLANOS DE ASSINATURA
// ==========================================
export interface SubscriptionPlan {
  id: string;
  name: string;
  nameKey: string;
  monthlyLimit: number;
  benefits: string[];
  benefitsKeys: string[];
  popular?: boolean;
  emoji: string;
  emojiMasculine: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: REVENUECAT_CONFIG.products.candyCandy.id!,
    name: 'CandyCandy',
    nameKey: 'planCandyCandy',
    monthlyLimit: 150,
    benefits: [
      '150 receitas por mês',
      'Imagens HD das receitas',
      'Passo a passo detalhado',
      'Sem anúncios',
      'Suporte prioritário',
    ],
    benefitsKeys: [
      'benefit150Recipes',
      'benefitHDImages',
      'benefitDetailedSteps',
      'benefitNoAds',
      'benefitPrioritySupport',
    ],
    popular: true,
    emoji: '👑',
    emojiMasculine: '⚡',
  },
  {
    id: REVENUECAT_CONFIG.products.candyCandyBasic.id!,
    name: 'CandyCandy Basic',
    nameKey: 'planCandyCandyBasic',
    monthlyLimit: 60,
    benefits: [
      '60 receitas por mês',
      'Imagens das receitas',
      'Passo a passo',
      'Anúncios reduzidos',
    ],
    benefitsKeys: [
      'benefit60Recipes',
      'benefitImages',
      'benefitSteps',
      'benefitReducedAds',
    ],
    popular: false,
    emoji: '🌟',
    emojiMasculine: '💪',
  },
];

// ==========================================
// 🔧 HELPERS
// ==========================================

/**
 * Obtém o limite mensal baseado no produto
 */
export function getMonthlyLimitForProduct(productId: string): number {
  if (productId.includes('candycandy_monthly') || productId.includes('candycandy.monthly')) {
    return REVENUECAT_CONFIG.products.candyCandy.monthlyLimit;
  }
  if (productId.includes('candycandybasic')) {
    return REVENUECAT_CONFIG.products.candyCandyBasic.monthlyLimit;
  }
  return 0; // Usuário free
}

/**
 * Obtém o nome do plano baseado no produto
 */
export function getPlanNameForProduct(productId: string): string {
  if (productId.includes('candycandy_monthly') || productId.includes('candycandy.monthly')) {
    return REVENUECAT_CONFIG.products.candyCandy.name;
  }
  if (productId.includes('candycandybasic')) {
    return REVENUECAT_CONFIG.products.candyCandyBasic.name;
  }
  return 'Free';
}
