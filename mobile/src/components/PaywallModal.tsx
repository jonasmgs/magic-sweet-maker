/**
 * Modal de Paywall - RevenueCat
 *
 * Exibe os planos de assinatura usando RevenueCat
 * Segue o tema do app (Doces 🧁 ou Heróis ⚡)
 * Preços localizados via RevenueCat (moeda local do usuário)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PurchasesPackage } from 'react-native-purchases';
import { useLanguage } from '../context/LanguageContext';
import { useSubscription } from '../context/SubscriptionContext';
import { SUBSCRIPTION_PLANS } from '../config/revenuecat';
import { getThemeColors, getThemeShadows, fonts, spacing, borderRadius } from '../utils/theme';
import { Button } from './Button';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PaywallModal({ visible, onClose }: PaywallModalProps) {
  const { theme, t } = useLanguage();
  const {
    packages,
    purchasePackage,
    restorePurchases,
    getLocalizedPrice,
    isPurchasing,
    isLoading,
  } = useSubscription();

  const themeColors = getThemeColors(theme);
  const themeShadows = getThemeShadows(theme);
  const isMasculine = theme === 'masculine';

  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Auto-selecionar o primeiro pacote quando disponível
  useEffect(() => {
    if (packages.length > 0 && !selectedPackage) {
      // Selecionar o plano mais caro (geralmente o primeiro/popular)
      setSelectedPackage(packages[0]);
    }
  }, [packages]);

  // Cores baseadas no tema
  const gradientColors = isMasculine
    ? ['#0F0F1A', '#1A1A2E', '#16213E'] as const
    : ['#87CEEB', '#E0F6FF', '#FFF5E1'] as const;

  const headerGradient = isMasculine
    ? ['#667EEA', '#764BA2'] as const
    : ['#FF6B9D', '#FFA07A'] as const;

  const cardBg = isMasculine ? '#1A1A2E' : '#FFFFFF';
  const textColor = isMasculine ? '#FFFFFF' : '#333333';
  const subtextColor = isMasculine ? '#A0AEC0' : '#6B7280';

  // Obter informações do plano para um pacote
  const getPlanInfo = (pkg: PurchasesPackage) => {
    const productId = pkg.product.identifier.toLowerCase();

    // Tentar encontrar o plano correspondente
    if (productId.includes('candycandy') && !productId.includes('basic')) {
      return SUBSCRIPTION_PLANS[0]; // CandyCandy
    }
    if (productId.includes('basic')) {
      return SUBSCRIPTION_PLANS[1]; // CandyCandy Basic
    }

    // Fallback: usar índice
    const index = packages.indexOf(pkg);
    return SUBSCRIPTION_PLANS[index] || SUBSCRIPTION_PLANS[0];
  };

  // Handler de compra
  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert(t.error, t.choosePlan);
      return;
    }

    if (!agreedToTerms) {
      Alert.alert(t.error, t.agreeToTerms);
      return;
    }

    const result = await purchasePackage(selectedPackage);

    if (result.success) {
      Alert.alert(t.success, t.purchaseSuccess, [
        { text: 'OK', onPress: onClose }
      ]);
    } else if (result.error !== 'cancelled') {
      Alert.alert(t.error, result.error || t.purchaseError);
    }
  };

  // Handler de restauração
  const handleRestore = async () => {
    setIsRestoring(true);

    const result = await restorePurchases();

    setIsRestoring(false);

    if (result.success) {
      Alert.alert(t.success, t.restoreSuccess, [
        { text: 'OK', onPress: onClose }
      ]);
    } else {
      Alert.alert(t.error, result.error || t.noSubscriptionFound);
    }
  };

  // Abrir termos de uso
  const openTerms = () => {
    Linking.openURL('https://magicsweetmaker.com/terms');
  };

  // Renderizar card do plano
  const renderPlanCard = (pkg: PurchasesPackage) => {
    const planInfo = getPlanInfo(pkg);
    const isSelected = selectedPackage?.identifier === pkg.identifier;
    const localizedPrice = getLocalizedPrice(pkg);

    return (
      <TouchableOpacity
        key={pkg.identifier}
        style={[
          styles.planCard,
          {
            backgroundColor: isSelected
              ? isMasculine
                ? 'rgba(102, 126, 234, 0.3)'
                : 'rgba(255, 107, 157, 0.2)'
              : cardBg,
            borderColor: isSelected ? themeColors.primary : isMasculine ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            borderWidth: isSelected ? 3 : 1,
          },
          themeShadows.card,
        ]}
        onPress={() => setSelectedPackage(pkg)}
        activeOpacity={0.7}
      >
        {/* Badge Popular */}
        {planInfo.popular && (
          <View style={[styles.popularBadge, { backgroundColor: themeColors.primary }]}>
            <Text style={styles.popularText}>{t.mostPopular}</Text>
          </View>
        )}

        {/* Header do plano */}
        <View style={styles.planHeader}>
          <Text style={styles.planEmoji}>
            {isMasculine ? planInfo.emojiMasculine : planInfo.emoji}
          </Text>
          <View style={styles.planTitleContainer}>
            <Text style={[styles.planName, { color: textColor }]}>
              {planInfo.name}
            </Text>
            <Text style={[styles.planLimit, { color: themeColors.primary }]}>
              {planInfo.monthlyLimit} {t.recipesPerMonth}
            </Text>
          </View>
        </View>

        {/* Preço (localizado via RevenueCat - moeda local!) */}
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: themeColors.primary }]}>
            {localizedPrice}
          </Text>
          <Text style={[styles.period, { color: subtextColor }]}>
            {t.perMonth}
          </Text>
        </View>

        {/* Benefícios */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitRow}>
            <Text style={styles.benefitIcon}>🖼️</Text>
            <Text style={[styles.benefitText, { color: textColor }]}>
              {t.hdImages}
            </Text>
          </View>
          <View style={styles.benefitRow}>
            <Text style={styles.benefitIcon}>📝</Text>
            <Text style={[styles.benefitText, { color: textColor }]}>
              {t.detailedSteps}
            </Text>
          </View>
          {planInfo.popular ? (
            <>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>🚫</Text>
                <Text style={[styles.benefitText, { color: textColor }]}>
                  {t.noAds}
                </Text>
              </View>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>⭐</Text>
                <Text style={[styles.benefitText, { color: textColor }]}>
                  {t.prioritySupport}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.benefitRow}>
              <Text style={styles.benefitIcon}>📢</Text>
              <Text style={[styles.benefitText, { color: textColor }]}>
                {t.reducedAds}
              </Text>
            </View>
          )}
        </View>

        {/* Indicador de seleção */}
        <View style={[
          styles.selectIndicator,
          {
            backgroundColor: isSelected ? themeColors.primary : 'transparent',
            borderColor: isSelected ? themeColors.primary : subtextColor,
          }
        ]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <LinearGradient colors={gradientColors} style={styles.overlay}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <LinearGradient
            colors={headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.emoji}>{isMasculine ? '⚡' : '✨'}</Text>
            <Text style={styles.title}>
              {isMasculine ? t.unlockPower : t.unlockMagic}
            </Text>
            <Text style={styles.subtitle}>{t.choosePlan}</Text>

            {/* Decoração */}
            <View style={styles.decorRow}>
              {(isMasculine ? ['🦸', '💪', '🔥'] : ['🧁', '🍰', '🍭']).map((e, i) => (
                <Text key={i} style={styles.decorEmoji}>{e}</Text>
              ))}
            </View>
          </LinearGradient>

          {/* Planos */}
          <View style={styles.plansContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={themeColors.primary} />
                <Text style={[styles.loadingText, { color: subtextColor }]}>
                  {t.loading}
                </Text>
              </View>
            ) : packages.length === 0 ? (
              // Fallback: mostrar planos estáticos se RevenueCat não carregar
              SUBSCRIPTION_PLANS.map((plan, index) => (
                <View
                  key={plan.id}
                  style={[
                    styles.planCard,
                    { backgroundColor: cardBg, borderWidth: 1, borderColor: isMasculine ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                    themeShadows.card,
                  ]}
                >
                  {plan.popular && (
                    <View style={[styles.popularBadge, { backgroundColor: themeColors.primary }]}>
                      <Text style={styles.popularText}>{t.mostPopular}</Text>
                    </View>
                  )}
                  <View style={styles.planHeader}>
                    <Text style={styles.planEmoji}>
                      {isMasculine ? plan.emojiMasculine : plan.emoji}
                    </Text>
                    <View style={styles.planTitleContainer}>
                      <Text style={[styles.planName, { color: textColor }]}>{plan.name}</Text>
                      <Text style={[styles.planLimit, { color: themeColors.primary }]}>
                        {plan.monthlyLimit} {t.recipesPerMonth}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.price, { color: themeColors.primary }]}>
                      ${index === 0 ? '9.99' : '4.99'}
                    </Text>
                    <Text style={[styles.period, { color: subtextColor }]}>{t.perMonth}</Text>
                  </View>
                </View>
              ))
            ) : (
              packages.map((pkg) => renderPlanCard(pkg))
            )}
          </View>

          {/* Checkbox de Termos */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox,
              {
                backgroundColor: agreedToTerms ? themeColors.primary : 'transparent',
                borderColor: themeColors.primary,
              }
            ]}>
              {agreedToTerms && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={[styles.termsText, { color: textColor }]}>
              {t.agreeToTerms}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={openTerms} style={styles.termsLinkContainer}>
            <Text style={[styles.termsLink, { color: themeColors.primary }]}>
              📄 {t.termsOfUse}
            </Text>
          </TouchableOpacity>

          {/* Botão de Assinar */}
          <View style={styles.buttonContainer}>
            <Button
              title={t.subscribe}
              onPress={handlePurchase}
              loading={isPurchasing}
              disabled={!agreedToTerms || isPurchasing || packages.length === 0}
              size="lg"
              icon={isMasculine ? '⚡' : '🌟'}
            />
          </View>

          {/* Informação de cancelamento */}
          <Text style={[styles.cancelInfo, { color: subtextColor }]}>
            {t.cancelAnytime}
          </Text>

          {/* Restaurar Compras */}
          <TouchableOpacity
            onPress={handleRestore}
            disabled={isRestoring}
            style={styles.restoreButton}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={themeColors.primary} />
            ) : (
              <Text style={[styles.restoreText, { color: themeColors.primary }]}>
                🔄 {t.restore}
              </Text>
            )}
          </TouchableOpacity>

          {/* Termos legais */}
          <View style={[styles.legalBox, { backgroundColor: isMasculine ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Text style={[styles.legalText, { color: subtextColor }]}>
              🔒 {t.termsNotice}
            </Text>
          </View>

          {/* Decoração */}
          <View style={styles.bottomDecor}>
            {(isMasculine ? ['🦸', '⚡', '💪', '🔥', '🌟'] : ['🧁', '🍰', '🍭', '🍓', '🍦']).map((e, i) => (
              <Text key={i} style={styles.bottomEmoji}>{e}</Text>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  header: {
    padding: spacing.xl,
    paddingTop: spacing.xxl + 20,
    alignItems: 'center',
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emoji: {
    fontSize: 60,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: fonts.sizes.lg,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  decorRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  decorEmoji: {
    fontSize: 24,
  },
  plansContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fonts.sizes.md,
  },
  planCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  popularText: {
    color: '#FFF',
    fontSize: fonts.sizes.xs,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planEmoji: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  planTitleContainer: {
    flex: 1,
  },
  planName: {
    fontSize: fonts.sizes.lg,
    fontWeight: 'bold',
  },
  planLimit: {
    fontSize: fonts.sizes.sm,
    fontWeight: '600',
    marginTop: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  price: {
    fontSize: 32,
    fontWeight: '900',
  },
  period: {
    fontSize: fonts.sizes.md,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  benefitsContainer: {
    gap: spacing.sm,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    width: 24,
  },
  benefitText: {
    fontSize: fonts.sizes.sm,
    flex: 1,
  },
  selectIndicator: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxCheck: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: fonts.sizes.sm,
    flex: 1,
  },
  termsLinkContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  termsLink: {
    fontSize: fonts.sizes.sm,
    fontWeight: 'bold',
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  cancelInfo: {
    fontSize: fonts.sizes.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  restoreButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  restoreText: {
    fontSize: fonts.sizes.sm,
    fontWeight: '600',
  },
  legalBox: {
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  legalText: {
    fontSize: fonts.sizes.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomDecor: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  bottomEmoji: {
    fontSize: 28,
    opacity: 0.6,
  },
});
