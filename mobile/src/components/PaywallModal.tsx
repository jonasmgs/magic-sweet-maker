/**
 * Modal de Paywall - Assinatura Premium
 *
 * Segue o tema do app (Doces 🧁 ou Heróis ⚡)
 * Suporta todos os 12 idiomas do app
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { getThemeColors, getThemeShadows, fonts, spacing, borderRadius } from '../utils/theme';
import { Button } from './Button';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  loading?: boolean;
}

export function PaywallModal({ visible, onClose, onSubscribe, loading }: PaywallModalProps) {
  const { theme, t } = useLanguage();
  const themeColors = getThemeColors(theme);
  const themeShadows = getThemeShadows(theme);
  const isMasculine = theme === 'masculine';

  // Features baseadas no tema (com emojis universais)
  const features = isMasculine
    ? [
        `⚡ 150 ${t.generations}`,
        '🦸 3D superhero characters',
        '🔥 All powers unlocked',
        '💪 No interruptions',
        '🌟 VIP support',
      ]
    : [
        `✨ 150 ${t.generations}`,
        '🧁 3D cute characters',
        '🌈 All themes unlocked',
        '🍭 No ads',
        '💖 Priority support',
      ];

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={gradientColors}
        style={styles.overlay}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.container, { backgroundColor: cardBg }, themeShadows.card]}>
            {/* Header com gradiente */}
            <LinearGradient
              colors={headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <Text style={styles.emoji}>{isMasculine ? '⚡' : '✨'}</Text>
              <Text style={styles.title}>
                {isMasculine ? t.unlockPower : t.unlockMagic}
              </Text>
              <Text style={styles.subtitle}>{t.monthlyPlan}</Text>

              {/* Decoração */}
              <View style={styles.decorRow}>
                {(isMasculine ? ['🦸', '💪', '🔥'] : ['🧁', '🍰', '🍭']).map((e, i) => (
                  <Text key={i} style={styles.decorEmoji}>{e}</Text>
                ))}
              </View>
            </LinearGradient>

            {/* Preço */}
            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                <Text style={[styles.price, { color: themeColors.primary }]}>
                  $9.99
                </Text>
                <Text style={[styles.period, { color: subtextColor }]}>
                  {t.perMonth}
                </Text>
              </View>
            </View>

            {/* Features */}
            <View style={styles.features}>
              {features.map((feature, index) => (
                <View
                  key={index}
                  style={[
                    styles.featureRow,
                    { backgroundColor: isMasculine ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }
                  ]}
                >
                  <Text style={[styles.featureText, { color: textColor }]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            {/* Botão de assinar */}
            <View style={styles.buttonContainer}>
              <Button
                title={t.subscribe}
                onPress={onSubscribe}
                loading={loading}
                size="lg"
                icon={isMasculine ? '⚡' : '🌟'}
              />
            </View>

            {/* Restaurar compra */}
            <TouchableOpacity style={styles.restoreButton}>
              <Text style={[styles.restoreText, { color: themeColors.primary }]}>
                {t.restore}
              </Text>
            </TouchableOpacity>

            {/* Termos */}
            <View style={[styles.termsBox, { backgroundColor: isMasculine ? 'rgba(102, 126, 234, 0.1)' : 'rgba(255, 107, 157, 0.1)' }]}>
              <Text style={[styles.terms, { color: subtextColor }]}>
                🔒 {t.termsNotice}
              </Text>
            </View>

            {/* Botão cancelar */}
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={[styles.cancelText, { color: subtextColor }]}>
                {t.cancel}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Emojis decorativos de fundo */}
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
    justifyContent: 'center',
    padding: spacing.lg,
  },
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  header: {
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 70,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fonts.sizes.xxl + 4,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 1,
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
    fontSize: 28,
  },
  priceContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 56,
    fontWeight: '900',
  },
  period: {
    fontSize: fonts.sizes.xl,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  features: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  featureRow: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  featureText: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
  },
  buttonContainer: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  restoreButton: {
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  restoreText: {
    fontSize: fonts.sizes.sm,
    fontWeight: '600',
  },
  termsBox: {
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  terms: {
    fontSize: fonts.sizes.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  cancelButton: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: fonts.sizes.md,
    fontWeight: '500',
  },
  bottomDecor: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  bottomEmoji: {
    fontSize: 32,
    opacity: 0.8,
  },
});
