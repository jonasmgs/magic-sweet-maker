/**
 * Modal de Paywall - Assinatura Premium
 *
 * Segue o tema do app (Doces 🧁 ou Heróis ⚡)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { getThemeColors, getThemeShadows, fonts, spacing, borderRadius } from '../utils/theme';
import { Button } from './Button';

const { width, height } = Dimensions.get('window');

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  loading?: boolean;
}

export function PaywallModal({ visible, onClose, onSubscribe, loading }: PaywallModalProps) {
  const { theme, language } = useLanguage();
  const themeColors = getThemeColors(theme);
  const themeShadows = getThemeShadows(theme);
  const isMasculine = theme === 'masculine';

  const texts = {
    pt: {
      title: isMasculine ? 'Libere seus Poderes!' : 'Desbloqueie a Magia!',
      subtitle: 'Assine o plano Premium',
      price: '$9,99',
      period: '/mês',
      features: isMasculine
        ? [
            '⚡ 150 receitas poderosas por mês',
            '🦸 150 personagens super-heróis 3D',
            '🔥 Acesso a todos os poderes',
            '💪 Sem interrupções',
            '🌟 Suporte VIP',
          ]
        : [
            '✨ 150 receitas mágicas por mês',
            '🧁 150 personagens fofos 3D',
            '🌈 Acesso a todos os temas',
            '🍭 Sem anúncios',
            '💖 Suporte prioritário',
          ],
      button: isMasculine ? 'Ativar Poderes' : 'Assinar Agora',
      cancel: 'Talvez depois',
      guarantee: '7 dias de garantia de reembolso',
    },
    en: {
      title: isMasculine ? 'Unlock Your Powers!' : 'Unlock the Magic!',
      subtitle: 'Subscribe to Premium',
      price: '$9.99',
      period: '/month',
      features: isMasculine
        ? [
            '⚡ 150 powerful recipes per month',
            '🦸 150 superhero 3D characters',
            '🔥 Access to all powers',
            '💪 No interruptions',
            '🌟 VIP support',
          ]
        : [
            '✨ 150 magical recipes per month',
            '🧁 150 cute 3D characters',
            '🌈 Access to all themes',
            '🍭 No ads',
            '💖 Priority support',
          ],
      button: isMasculine ? 'Activate Powers' : 'Subscribe Now',
      cancel: 'Maybe later',
      guarantee: '7-day money-back guarantee',
    },
  };

  const t = texts[language];

  // Cores baseadas no tema
  const gradientColors = isMasculine
    ? ['#0F0F1A', '#1A1A2E', '#16213E']
    : ['#87CEEB', '#E0F6FF', '#FFF5E1'];

  const headerGradient = isMasculine
    ? ['#667EEA', '#764BA2']
    : ['#FF6B9D', '#FFA07A'];

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
              <Text style={styles.title}>{t.title}</Text>
              <Text style={styles.subtitle}>{t.subtitle}</Text>

              {/* Decoração */}
              <View style={styles.decorRow}>
                {(isMasculine ? ['🦸', '💪', '🔥'] : ['🧁', '🍰', '🍭']).map((e, i) => (
                  <Text key={i} style={styles.decorEmoji}>{e}</Text>
                ))}
              </View>
            </LinearGradient>

            {/* Preço */}
            <View style={styles.priceContainer}>
              <Text style={[styles.priceLabel, { color: subtextColor }]}>
                {language === 'pt' ? 'Apenas' : 'Only'}
              </Text>
              <View style={styles.priceRow}>
                <Text style={[styles.price, { color: themeColors.primary }]}>
                  {t.price}
                </Text>
                <Text style={[styles.period, { color: subtextColor }]}>
                  {t.period}
                </Text>
              </View>
            </View>

            {/* Features */}
            <View style={styles.features}>
              {t.features.map((feature, index) => (
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
                title={t.button}
                onPress={onSubscribe}
                loading={loading}
                size="lg"
                icon={isMasculine ? '⚡' : '🌟'}
              />
            </View>

            {/* Garantia */}
            <View style={[styles.guaranteeBox, { backgroundColor: isMasculine ? 'rgba(102, 126, 234, 0.1)' : 'rgba(255, 107, 157, 0.1)' }]}>
              <Text style={[styles.guarantee, { color: themeColors.primary }]}>
                🔒 {t.guarantee}
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
  priceLabel: {
    fontSize: fonts.sizes.md,
    marginBottom: spacing.xs,
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
  guaranteeBox: {
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  guarantee: {
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
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
