/**
 * Tela de Resultado - Receita e Imagem
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/Button';
import { getThemeColors, fonts, spacing, borderRadius, shadows } from '../utils/theme';
import { Recipe } from '../services/api';

const { width } = Dimensions.get('window');

export function ResultScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, t, language } = useLanguage();
  const themeColors = getThemeColors(theme);
  const isMasculine = theme === 'masculine';

  const recipe: Recipe = route.params?.recipe;

  if (!recipe) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {t.recipeNotFound}
        </Text>
      </View>
    );
  }

  const handleCreateAnother = () => {
    navigation.navigate('Home');
  };

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
          {/* Confetes/Celebração */}
          <View style={styles.celebrationContainer}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationEmoji}>✨</Text>
            <Text style={styles.celebrationEmoji}>🎊</Text>
          </View>

          {/* Nome da Sobremesa */}
          <Text style={[styles.dessertName, { color: themeColors.primary }]}>
            {recipe.name}
          </Text>

          {/* Imagem */}
          <View style={[styles.imageContainer, shadows.lg]}>
            <Image
              source={{ uri: recipe.image }}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.imageDecor}>
              <Text style={styles.imageDecoEmoji}>⭐</Text>
            </View>
            <View style={[styles.imageDecor, styles.imageDecorBottom]}>
              <Text style={styles.imageDecoEmoji}>{isMasculine ? '⚡' : '🍭'}</Text>
            </View>
          </View>

          {/* Card da Receita */}
          <View style={[styles.recipeCard, { backgroundColor: themeColors.card }, shadows.md]}>
            {/* Header do Card */}
            <View style={[styles.cardHeader, { backgroundColor: themeColors.primary + '20' }]}>
              <Text style={styles.cardHeaderEmoji}>📜</Text>
              <Text style={[styles.cardHeaderText, { color: themeColors.text }]}>
                {t.recipeTitle}
              </Text>
            </View>

            {/* Ingredientes */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
                {isMasculine ? t.ingredientsTitleHero : t.ingredientsTitle}
              </Text>
              <View style={styles.ingredientsList}>
                {recipe.ingredients.map((ingredient, index) => (
                  <View
                    key={index}
                    style={[
                      styles.ingredientChip,
                      { backgroundColor: themeColors.secondary + '30' },
                    ]}
                  >
                    <Text style={styles.ingredientEmoji}>{isMasculine ? '💪' : '🌟'}</Text>
                    <Text style={[styles.ingredientText, { color: themeColors.text }]}>
                      {ingredient}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Passos */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>
                {isMasculine ? t.stepsTitleHero : t.stepsTitle}
              </Text>
              <View style={styles.stepsList}>
                {recipe.steps.map((step, index) => (
                  <View key={index} style={styles.stepContainer}>
                    <View
                      style={[
                        styles.stepNumber,
                        { backgroundColor: themeColors.primary },
                      ]}
                    >
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.stepText, { color: themeColors.text }]}>
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Aviso de Segurança */}
            <View style={[styles.warningBox, { backgroundColor: '#FFF3CD' }]}>
              <Text style={styles.warningText}>
                ⚠️ {t.safetyWarning}
              </Text>
            </View>
          </View>

          {/* Botão Criar Outro */}
          <Button
            title={t.createAnother}
            onPress={handleCreateAnother}
            icon={isMasculine ? '⚡' : '🍰'}
            size="lg"
            style={styles.createButton}
          />

          {/* Emojis decorativos */}
          <View style={styles.emojisRow}>
            {(isMasculine ? ['🦸', '⚡', '💪', '🔥', '🌟'] : ['🧁', '🍰', '🍭', '🍓', '🍦']).map(
              (emoji, index) => (
                <Text key={index} style={styles.decorEmoji}>
                  {emoji}
                </Text>
              )
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: fonts.sizes.lg,
  },
  celebrationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  celebrationEmoji: {
    fontSize: 32,
  },
  dessertName: {
    fontSize: fonts.sizes.title,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: spacing.lg,
    textShadowColor: 'rgba(255, 107, 157, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    letterSpacing: 1,
  },
  imageContainer: {
    width: width - spacing.lg * 2,
    height: width - spacing.lg * 2,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageDecor: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  imageDecorBottom: {
    top: 'auto',
    right: 'auto',
    bottom: -10,
    left: -10,
  },
  imageDecoEmoji: {
    fontSize: 40,
  },
  recipeCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeaderEmoji: {
    fontSize: 24,
  },
  cardHeaderText: {
    fontSize: fonts.sizes.xl,
    fontWeight: 'bold',
  },
  section: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  ingredientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  ingredientEmoji: {
    fontSize: 14,
  },
  ingredientText: {
    fontSize: fonts.sizes.sm,
  },
  stepsList: {
    gap: spacing.md,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: fonts.sizes.md,
  },
  stepText: {
    flex: 1,
    fontSize: fonts.sizes.md,
    lineHeight: 22,
  },
  warningBox: {
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  warningText: {
    color: '#856404',
    fontSize: fonts.sizes.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  createButton: {
    marginBottom: spacing.lg,
  },
  emojisRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  decorEmoji: {
    fontSize: 32,
  },
});
