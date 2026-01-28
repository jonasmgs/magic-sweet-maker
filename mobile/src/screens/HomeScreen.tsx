/**
 * Tela Principal - Seleção de Ingredientes
 *
 * Usa RevenueCat para verificar assinatura e limites
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
import { useSubscription } from '../context/SubscriptionContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PaywallModal } from '../components/PaywallModal';
import { getThemeColors, fonts, spacing, borderRadius, shadows } from '../utils/theme';

const POPULAR_INGREDIENTS = {
  pt: ['chocolate', 'morango', 'leite condensado', 'banana', 'baunilha', 'caramelo'],
  en: ['chocolate', 'strawberry', 'condensed milk', 'banana', 'vanilla', 'caramel'],
  es: ['chocolate', 'fresa', 'leche condensada', 'plátano', 'vainilla', 'caramelo'],
  fr: ['chocolat', 'fraise', 'lait concentré', 'banane', 'vanille', 'caramel'],
  de: ['Schokolade', 'Erdbeere', 'Kondensmilch', 'Banane', 'Vanille', 'Karamell'],
  it: ['cioccolato', 'fragola', 'latte condensato', 'banana', 'vaniglia', 'caramello'],
  ja: ['チョコレート', 'いちご', '練乳', 'バナナ', 'バニラ', 'キャラメル'],
  ko: ['초콜릿', '딸기', '연유', '바나나', '바닐라', '카라멜'],
  zh: ['巧克力', '草莓', '炼乳', '香蕉', '香草', '焦糖'],
  ru: ['шоколад', 'клубника', 'сгущёнка', 'банан', 'ваниль', 'карамель'],
  ar: ['شوكولاتة', 'فراولة', 'حليب مكثف', 'موز', 'فانيليا', 'كراميل'],
  hi: ['चॉकलेट', 'स्ट्रॉबेरी', 'कंडेंस्ड मिल्क', 'केला', 'वनीला', 'कारमेल'],
};

export function HomeScreen() {
  const [ingredients, setIngredients] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme, t, language, setTheme } = useLanguage();
  const {
    subscription,
    isPremium,
    canCreateRecipe,
    incrementUsage,
  } = useSubscription();

  const themeColors = getThemeColors(theme);
  const isMasculine = theme === 'masculine';

  const handleGenerate = async () => {
    if (!ingredients.trim()) {
      Alert.alert(
        t.errorTitle,
        language === 'pt' ? 'Digite pelo menos um ingrediente' : 'Enter at least one ingredient'
      );
      return;
    }

    // Verificar se tem assinatura premium
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }

    // Verificar se ainda tem receitas disponíveis no mês
    if (!canCreateRecipe()) {
      Alert.alert(
        t.limitReached,
        `${t.usedThisMonth}: ${subscription.usedThisMonth}/${subscription.monthlyLimit}`,
        [
          { text: 'OK' },
          {
            text: t.upgrade,
            onPress: () => setShowPaywall(true),
          },
        ]
      );
      return;
    }

    // Incrementar uso e navegar
    const success = await incrementUsage();
    if (success) {
      navigation.navigate('Generation', { ingredients, theme, language });
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

  const popularIngredients = POPULAR_INGREDIENTS[language as keyof typeof POPULAR_INGREDIENTS] || POPULAR_INGREDIENTS.en;

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
                {t.welcome} {user?.name || ''}! 👋
              </Text>

              {/* Status da assinatura */}
              {isPremium ? (
                <View style={styles.subscriptionInfo}>
                  <View style={[styles.premiumBadge, { backgroundColor: themeColors.primary }]}>
                    <Text style={styles.premiumText}>⭐ {subscription.planName}</Text>
                  </View>
                  <Text style={[styles.usageText, { color: themeColors.primary }]}>
                    {isMasculine ? '⚡' : '✨'} {subscription.remainingThisMonth}/{subscription.monthlyLimit} {t.remainingRecipes}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setShowPaywall(true)}>
                  <View style={[styles.freeBadge, { borderColor: themeColors.primary }]}>
                    <Text style={[styles.freeText, { color: themeColors.primary }]}>
                      🔒 {t.free} - {t.upgrade}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Theme Toggle */}
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
            <Text style={[styles.title, { color: themeColors.text }]}>
              {isMasculine ? t.titleMasculine : t.title}
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              {isMasculine ? t.subtitleMasculine : t.subtitle}
            </Text>
          </View>

          {/* Input de ingredientes */}
          <View style={[styles.inputCard, { backgroundColor: themeColors.card }, shadows.md]}>
            <Input
              label={`${isMasculine ? '🔥' : '🍭'} ${language === 'pt' ? 'Ingredientes' : 'Ingredients'}`}
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
              title={isMasculine ? t.buttonTextMasculine : t.buttonText}
              onPress={handleGenerate}
              icon={isMasculine ? '⚡' : '🪄'}
              size="lg"
              style={styles.generateButton}
            />

            {/* Mostra hint para assinar se não for premium */}
            {!isPremium && (
              <TouchableOpacity
                onPress={() => setShowPaywall(true)}
                style={styles.upgradeHint}
              >
                <Text style={[styles.upgradeHintText, { color: themeColors.primary }]}>
                  {isMasculine ? '🔓' : '✨'} {language === 'pt'
                    ? 'Assine para criar receitas mágicas!'
                    : 'Subscribe to create magic recipes!'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Mostra limite se for premium */}
            {isPremium && subscription.remainingThisMonth <= 10 && (
              <View style={[styles.limitWarning, { backgroundColor: themeColors.warning + '20' }]}>
                <Text style={[styles.limitWarningText, { color: themeColors.warning }]}>
                  ⚠️ {subscription.remainingThisMonth} {t.remainingRecipes}
                </Text>
              </View>
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

      {/* Modal de Paywall com RevenueCat */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
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
  subscriptionInfo: {
    marginTop: spacing.xs,
  },
  premiumBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    alignSelf: 'flex-start',
  },
  premiumText: {
    fontSize: fonts.sizes.xs,
    fontWeight: 'bold',
    color: '#FFF',
  },
  usageText: {
    fontSize: fonts.sizes.sm,
    fontWeight: '600',
  },
  freeBadge: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  freeText: {
    fontSize: fonts.sizes.xs,
    fontWeight: '600',
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
    padding: spacing.sm,
  },
  upgradeHintText: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
  },
  limitWarning: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  limitWarningText: {
    fontSize: fonts.sizes.sm,
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
