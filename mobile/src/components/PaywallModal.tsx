/**
 * Modal de Paywall - Assinatura Premium
 *
 * Aparece quando o usuário tenta gerar sem créditos/assinatura
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { getThemeColors, fonts, spacing, borderRadius } from '../utils/theme';
import { Button } from './Button';

const { width } = Dimensions.get('window');

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  loading?: boolean;
}

export function PaywallModal({ visible, onClose, onSubscribe, loading }: PaywallModalProps) {
  const { theme, language } = useLanguage();
  const themeColors = getThemeColors(theme);
  const isMasculine = theme === 'masculine';

  const texts = {
    pt: {
      title: 'Desbloqueie a Magia!',
      subtitle: 'Assine o plano Premium',
      price: '$9,99',
      period: '/mês',
      features: [
        '150 receitas mágicas por mês',
        '150 imagens de personagens 3D',
        'Acesso a todos os temas',
        'Sem anúncios',
        'Suporte prioritário',
      ],
      button: 'Assinar Agora',
      cancel: 'Talvez depois',
      guarantee: '7 dias de garantia de reembolso',
    },
    en: {
      title: 'Unlock the Magic!',
      subtitle: 'Subscribe to Premium',
      price: '$9.99',
      period: '/month',
      features: [
        '150 magical recipes per month',
        '150 3D character images',
        'Access to all themes',
        'No ads',
        'Priority support',
      ],
      button: 'Subscribe Now',
      cancel: 'Maybe later',
      guarantee: '7-day money-back guarantee',
    },
  };

  const t = texts[language];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: themeColors.card }]}>
          {/* Header com gradiente */}
          <LinearGradient
            colors={isMasculine ? ['#667EEA', '#764BA2'] : ['#FF6B9D', '#FFA07A']}
            style={styles.header}
          >
            <Text style={styles.emoji}>{isMasculine ? '⚡' : '✨'}</Text>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>{t.subtitle}</Text>
          </LinearGradient>

          {/* Preço */}
          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: themeColors.primary }]}>
              {t.price}
            </Text>
            <Text style={[styles.period, { color: themeColors.textSecondary }]}>
              {t.period}
            </Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            {t.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={[styles.featureText, { color: themeColors.text }]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* Botão de assinar */}
          <Button
            title={t.button}
            onPress={onSubscribe}
            loading={loading}
            size="lg"
            icon={isMasculine ? '⚡' : '🌟'}
            style={styles.subscribeButton}
          />

          {/* Garantia */}
          <Text style={[styles.guarantee, { color: themeColors.textSecondary }]}>
            🔒 {t.guarantee}
          </Text>

          {/* Botão cancelar */}
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: themeColors.textSecondary }]}>
              {t.cancel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    width: width - spacing.lg * 2,
    maxWidth: 400,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  header: {
    padding: spacing.xl,
    alignItems: 'center',
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
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: fonts.sizes.md,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: spacing.xs,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  price: {
    fontSize: 48,
    fontWeight: '900',
  },
  period: {
    fontSize: fonts.sizes.lg,
    marginLeft: spacing.xs,
  },
  features: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  checkmark: {
    fontSize: 18,
    color: '#4CAF50',
    marginRight: spacing.sm,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: fonts.sizes.md,
    flex: 1,
  },
  subscribeButton: {
    marginHorizontal: spacing.lg,
  },
  guarantee: {
    fontSize: fonts.sizes.sm,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  cancelButton: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: fonts.sizes.md,
  },
});
