/**
 * Tela Principal - Seleção de Ingredientes
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { userService } from '../services/api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PaywallModal } from '../components/PaywallModal';
import { getThemeColors, fonts, spacing, borderRadius, shadows } from '../utils/theme';

const POPULAR_INGREDIENTS = {
  pt: ['chocolate', 'morango', 'leite condensado', 'banana', 'baunilha', 'caramelo'],
  en: ['chocolate', 'strawberry', 'condensed milk', 'banana', 'vanilla', 'caramel'],
};

export function HomeScreen() {
  const [ingredients, setIngredients] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const navigation = useNavigation<any>();
  const { user, refreshUser } = useAuth();
  const { theme, t, language, setTheme } = useLanguage();
  const themeColors = getThemeColors(theme);
  const isMasculine = theme === 'masculine';

  const isPremium = user?.plan === 'premium';
  const hasCredits = user && user.credits > 0;

  const handleGenerate = () => {
    if (!ingredients.trim()) {
      Alert.alert(
        language === 'pt' ? 'Ops!' : 'Oops!',
        language === 'pt' ? 'Digite pelo menos um ingrediente' : 'Enter at least one ingredient'
      );
      return;
    }

    // Se não tem créditos, mostra paywall
    if (!hasCredits) {
      setShowPaywall(true);
      return;
    }

    navigation.navigate('Generation', { ingredients, theme, language });
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      // Aqui você integraria com a loja (App Store / Google Play)
      // Por enquanto, simula o upgrade
      await userService.upgrade();
      await refreshUser();
      setShowPaywall(false);

      Alert.alert(
        '🎉',
        language === 'pt'
          ? 'Parabéns! Agora você tem 150 créditos!'
          : 'Congratulations! You now have 150 credits!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Após assinar, gera automaticamente
              if (ingredients.trim()) {
                navigation.navigate('Generation', { ingredients, theme, language });
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Erro',
        language === 'pt' ? 'Erro ao processar assinatura' : 'Error processing subscription'
      );
    } finally {
      setSubscribing(false);
    }
  };

  const addIngredient = (ingredient: string) => {
    const current = ingredients.trim();
    if (current) {
      setIngredients(`${current}, ${ingredient}`);
    } else {
      setIngredients(ingredient);
    }
  };

  const popularIngredients = POPULAR_INGREDIENTS[language] || POPULAR_INGREDIENTS.pt;

  return (
    <LinearGradient
      colors={isMasculine ? ['#0F0F1A', '#1A1A2E', '#16213E'] : ['#87CEEB', '#E0F6FF', '#FFF5E1']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: themeColors.textSecondary }]}>
                {language === 'pt' ? 'Olá' : 'Hello'} {user?.name || ''}! 👋
              </Text>
              <View style={styles.creditsContainer}>
                {isPremium ? (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumText}>⭐ Premium</Text>
                  </View>
                ) : null}
                <Text style={[styles.credits, { color: themeColors.primary }]}>
                  ✨ {user?.credits || 0} {t.creditsLeft}
                </Text>
              </View>
            </View>
            <View style={styles.themeToggle}>
              <TouchableOpacity
                onPress={() => setTheme('feminine')}
                style={[
                  styles.themeOption,
                  theme === 'feminine' && { backgroundColor: themeColors.primary + '30' },
                ]}
              >
                <Text style={styles.themeEmoji}>🧁</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTheme('masculine')}
                style={[
                  styles.themeOption,
                  theme === 'masculine' && { backgroundColor: themeColors.primary + '30' },
                ]}
              >
                <Text style={styles.themeEmoji}>🦸</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Título */}
          <View style={styles.titleContainer}>
            <Text style={styles.titleEmoji}>{isMasculine ? '⚡' : '🪄'}</Text>
            <Text style={[styles.title, { color: themeColors.text }]}>{t.title}</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              {t.subtitle}
            </Text>
          </View>

          {/* Input de ingredientes */}
          <View style={[styles.inputCard, { backgroundColor: themeColors.card }, shadows.md]}>
            <Input
              label={language === 'pt' ? '🍭 Ingredientes' : '🍭 Ingredients'}
              value={ingredients}
              onChangeText={setIngredients}
              placeholder={t.inputPlaceholder}
              multiline
              numberOfLines={3}
              containerStyle={styles.inputContainer}
            />

            {/* Ingredientes populares */}
            <Text style={[styles.popularTitle, { color: themeColors.textSecondary }]}>
              {language === 'pt' ? 'Ingredientes populares:' : 'Popular ingredients:'}
            </Text>
            <View style={styles.popularContainer}>
              {popularIngredients.map((ingredient, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => addIngredient(ingredient)}
                  style={[
                    styles.popularChip,
                    { backgroundColor: themeColors.secondary + '40' },
                  ]}
                >
                  <Text style={[styles.popularText, { color: themeColors.text }]}>
                    {ingredient}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title={t.buttonText}
              onPress={handleGenerate}
              icon={isMasculine ? '⚡' : '🪄'}
              size="lg"
              style={styles.generateButton}
            />

            {/* Mostra quantos créditos restam */}
            {!hasCredits && (
              <TouchableOpacity
                onPress={() => setShowPaywall(true)}
                style={styles.upgradeHint}
              >
                <Text style={[styles.upgradeHintText, { color: themeColors.primary }]}>
                  {language === 'pt'
                    ? '🔒 Assine para desbloquear'
                    : '🔒 Subscribe to unlock'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Emojis decorativos */}
          <View style={styles.emojisRow}>
            {(isMasculine ? ['🦸', '⚡', '💪', '🔥', '🌟'] : ['🍰', '🍭', '🍫', '🍓', '🍦']).map(
              (emoji, index) => (
                <Text key={index} style={styles.decorEmoji}>
                  {emoji}
                </Text>
              )
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Modal de Paywall */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={handleSubscribe}
        loading={subscribing}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fonts.sizes.md,
  },
  creditsContainer: {
    marginTop: spacing.xs,
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    alignSelf: 'flex-start',
  },
  premiumText: {
    fontSize: fonts.sizes.xs,
    fontWeight: 'bold',
    color: '#333',
  },
  credits: {
    fontSize: fonts.sizes.lg,
    fontWeight: 'bold',
  },
  themeToggle: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  themeOption: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  themeEmoji: {
    fontSize: 24,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  titleEmoji: {
    fontSize: 60,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fonts.sizes.title,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 107, 157, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: fonts.sizes.md,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  inputCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  popularTitle: {
    fontSize: fonts.sizes.sm,
    marginBottom: spacing.sm,
  },
  popularContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  popularChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  popularText: {
    fontSize: fonts.sizes.sm,
  },
  generateButton: {
    marginTop: spacing.sm,
  },
  upgradeHint: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  upgradeHintText: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
  },
  emojisRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  decorEmoji: {
    fontSize: 32,
  },
});
