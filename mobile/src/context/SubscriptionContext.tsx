/**
 * Contexto de Assinatura - RevenueCat
 *
 * Gerencia:
 * - Estado da assinatura
 * - Compras in-app
 * - Limites mensais de receitas
 * - Restauração de compras
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Platform, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  PurchasesError,
  LOG_LEVEL,
} from 'react-native-purchases';
import {
  REVENUECAT_CONFIG,
  getMonthlyLimitForProduct,
  getPlanNameForProduct,
} from '../config/revenuecat';

// ==========================================
// 📋 TIPOS
// ==========================================

export type SubscriptionStatus = 'free' | 'premium' | 'loading' | 'error';

export interface SubscriptionState {
  status: SubscriptionStatus;
  planName: string;
  productId: string | null;
  monthlyLimit: number;
  usedThisMonth: number;
  remainingThisMonth: number;
  expirationDate: Date | null;
  willRenew: boolean;
}

interface SubscriptionContextType {
  // Estado
  subscription: SubscriptionState;
  offerings: PurchasesOffering | null;
  packages: PurchasesPackage[];
  isLoading: boolean;
  isPurchasing: boolean;

  // Ações
  purchasePackage: (pkg: PurchasesPackage) => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
  checkSubscription: () => Promise<void>;
  incrementUsage: () => Promise<boolean>;
  canCreateRecipe: () => boolean;

  // Helpers
  getLocalizedPrice: (pkg: PurchasesPackage) => string;
  isPremium: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// ==========================================
// 🔑 CHAVES DE STORAGE
// ==========================================
const STORAGE_KEYS = {
  USAGE_COUNT: 'subscription_usage_count',
  USAGE_RESET_DATE: 'subscription_usage_reset_date',
};

// ==========================================
// 📦 PROVIDER
// ==========================================

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionState>({
    status: 'loading',
    planName: 'Free',
    productId: null,
    monthlyLimit: 0,
    usedThisMonth: 0,
    remainingThisMonth: 0,
    expirationDate: null,
    willRenew: false,
  });

  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // ==========================================
  // 🚀 INICIALIZAÇÃO
  // ==========================================

  useEffect(() => {
    initializeRevenueCat();
  }, []);

  const initializeRevenueCat = async () => {
    try {
      // Configurar log level em desenvolvimento
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // Configurar RevenueCat
      await Purchases.configure({
        apiKey: REVENUECAT_CONFIG.apiKey!,
      });

      setIsInitialized(true);

      // Listener para mudanças no CustomerInfo
      Purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);

      // Carregar dados iniciais
      await Promise.all([
        checkSubscription(),
        loadOfferings(),
        loadUsageData(),
      ]);
    } catch (error) {
      console.error('Erro ao inicializar RevenueCat:', error);
      setSubscription(prev => ({ ...prev, status: 'error' }));
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 📊 VERIFICAÇÃO DE ASSINATURA
  // ==========================================

  const handleCustomerInfoUpdate = useCallback((customerInfo: CustomerInfo) => {
    updateSubscriptionFromCustomerInfo(customerInfo);
  }, []);

  const checkSubscription = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      await updateSubscriptionFromCustomerInfo(customerInfo);
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
    }
  };

  const updateSubscriptionFromCustomerInfo = async (customerInfo: CustomerInfo) => {
    const entitlement = customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlementId];

    if (entitlement && entitlement.isActive) {
      const productId = entitlement.productIdentifier;
      const monthlyLimit = getMonthlyLimitForProduct(productId);
      const planName = getPlanNameForProduct(productId);
      const usedThisMonth = await getUsageCount();

      // Verificar se precisa resetar o contador (novo ciclo de cobrança)
      await checkAndResetUsageIfNeeded(entitlement.latestPurchaseDate);

      setSubscription({
        status: 'premium',
        planName,
        productId,
        monthlyLimit,
        usedThisMonth,
        remainingThisMonth: Math.max(0, monthlyLimit - usedThisMonth),
        expirationDate: entitlement.expirationDate ? new Date(entitlement.expirationDate) : null,
        willRenew: entitlement.willRenew,
      });
    } else {
      // Usuário free
      setSubscription({
        status: 'free',
        planName: 'Free',
        productId: null,
        monthlyLimit: 0,
        usedThisMonth: 0,
        remainingThisMonth: 0,
        expirationDate: null,
        willRenew: false,
      });
    }
  };

  // ==========================================
  // 📦 OFFERINGS
  // ==========================================

  const loadOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();

      if (offerings.current) {
        setOfferings(offerings.current);
        setPackages(offerings.current.availablePackages);
      }
    } catch (error) {
      console.error('Erro ao carregar offerings:', error);
    }
  };

  // ==========================================
  // 💳 COMPRA
  // ==========================================

  const purchasePackage = async (pkg: PurchasesPackage): Promise<{ success: boolean; error?: string }> => {
    if (isPurchasing) {
      return { success: false, error: 'Compra já em andamento' };
    }

    setIsPurchasing(true);

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);

      // Verificar se a compra foi bem sucedida
      const entitlement = customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlementId];

      if (entitlement && entitlement.isActive) {
        // Resetar contador de uso para o novo ciclo
        await resetUsageCount();
        await updateSubscriptionFromCustomerInfo(customerInfo);

        return { success: true };
      }

      return { success: false, error: 'Assinatura não ativada' };
    } catch (error) {
      const purchaseError = error as PurchasesError;

      // Usuário cancelou
      if (purchaseError.userCancelled) {
        return { success: false, error: 'cancelled' };
      }

      // Erro de pagamento
      console.error('Erro na compra:', purchaseError);
      return {
        success: false,
        error: purchaseError.message || 'Erro ao processar pagamento',
      };
    } finally {
      setIsPurchasing(false);
    }
  };

  // ==========================================
  // 🔄 RESTAURAR COMPRAS
  // ==========================================

  const restorePurchases = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const customerInfo = await Purchases.restorePurchases();
      await updateSubscriptionFromCustomerInfo(customerInfo);

      const hasEntitlement = customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlementId];

      if (hasEntitlement) {
        return { success: true };
      }

      return { success: false, error: 'Nenhuma assinatura encontrada' };
    } catch (error) {
      console.error('Erro ao restaurar compras:', error);
      return { success: false, error: 'Erro ao restaurar compras' };
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 📊 CONTROLE DE LIMITES
  // ==========================================

  const getUsageCount = async (): Promise<number> => {
    try {
      const count = await SecureStore.getItemAsync(STORAGE_KEYS.USAGE_COUNT);
      return count ? parseInt(count, 10) : 0;
    } catch {
      return 0;
    }
  };

  const setUsageCount = async (count: number) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.USAGE_COUNT, count.toString());
    } catch (error) {
      console.error('Erro ao salvar uso:', error);
    }
  };

  const loadUsageData = async () => {
    const usedThisMonth = await getUsageCount();
    setSubscription(prev => ({
      ...prev,
      usedThisMonth,
      remainingThisMonth: Math.max(0, prev.monthlyLimit - usedThisMonth),
    }));
  };

  const resetUsageCount = async () => {
    await setUsageCount(0);
    await SecureStore.setItemAsync(STORAGE_KEYS.USAGE_RESET_DATE, new Date().toISOString());

    setSubscription(prev => ({
      ...prev,
      usedThisMonth: 0,
      remainingThisMonth: prev.monthlyLimit,
    }));
  };

  const checkAndResetUsageIfNeeded = async (latestPurchaseDate: string) => {
    try {
      const lastResetStr = await SecureStore.getItemAsync(STORAGE_KEYS.USAGE_RESET_DATE);

      if (!lastResetStr) {
        // Primeira vez - resetar
        await resetUsageCount();
        return;
      }

      const lastReset = new Date(lastResetStr);
      const purchaseDate = new Date(latestPurchaseDate);

      // Se a última compra/renovação foi depois do último reset, resetar
      if (purchaseDate > lastReset) {
        await resetUsageCount();
      }
    } catch (error) {
      console.error('Erro ao verificar reset:', error);
    }
  };

  const incrementUsage = async (): Promise<boolean> => {
    if (subscription.status !== 'premium') {
      return false;
    }

    if (subscription.usedThisMonth >= subscription.monthlyLimit) {
      return false;
    }

    const newCount = subscription.usedThisMonth + 1;
    await setUsageCount(newCount);

    setSubscription(prev => ({
      ...prev,
      usedThisMonth: newCount,
      remainingThisMonth: Math.max(0, prev.monthlyLimit - newCount),
    }));

    return true;
  };

  const canCreateRecipe = (): boolean => {
    if (subscription.status !== 'premium') {
      return false;
    }

    return subscription.usedThisMonth < subscription.monthlyLimit;
  };

  // ==========================================
  // 🔧 HELPERS
  // ==========================================

  const getLocalizedPrice = (pkg: PurchasesPackage): string => {
    return pkg.product.priceString;
  };

  const isPremium = subscription.status === 'premium';

  // ==========================================
  // 📤 VALOR DO CONTEXTO
  // ==========================================

  const value: SubscriptionContextType = {
    subscription,
    offerings,
    packages,
    isLoading,
    isPurchasing,
    purchasePackage,
    restorePurchases,
    checkSubscription,
    incrementUsage,
    canCreateRecipe,
    getLocalizedPrice,
    isPremium,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// ==========================================
// 🪝 HOOK
// ==========================================

export function useSubscription() {
  const context = useContext(SubscriptionContext);

  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }

  return context;
}
