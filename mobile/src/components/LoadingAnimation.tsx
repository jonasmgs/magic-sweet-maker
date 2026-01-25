/**
 * Animação de Loading com Varinha Mágica
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { getThemeColors, fonts, spacing } from '../utils/theme';

export function LoadingAnimation() {
  const { theme, t } = useLanguage();
  const themeColors = getThemeColors(theme);
  const isMasculine = theme === 'masculine';

  // Animações
  const wandRotation = useRef(new Animated.Value(0)).current;
  const sparkleScale = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animação da varinha
    Animated.loop(
      Animated.sequence([
        Animated.timing(wandRotation, {
          toValue: 1,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(wandRotation, {
          toValue: 0,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animação das estrelas
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleScale, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animação da barra de progresso
    Animated.loop(
      Animated.timing(progressWidth, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const wandRotateStyle = {
    transform: [
      {
        rotate: wandRotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['-15deg', '15deg'],
        }),
      },
    ],
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Varinha Mágica */}
      <Animated.Text style={[styles.wand, wandRotateStyle]}>
        {isMasculine ? '⚡' : '🪄'}
      </Animated.Text>

      {/* Estrelas ao redor */}
      <View style={styles.sparklesContainer}>
        {['✨', '⭐', '💫', '🌟', '✧', '★'].map((star, index) => (
          <Animated.Text
            key={index}
            style={[
              styles.sparkle,
              {
                opacity: sparkleScale,
                transform: [
                  { scale: sparkleScale },
                  { translateX: Math.cos(index * 60 * (Math.PI / 180)) * 60 },
                  { translateY: Math.sin(index * 60 * (Math.PI / 180)) * 60 },
                ],
              },
            ]}
          >
            {star}
          </Animated.Text>
        ))}
      </View>

      {/* Texto de carregamento */}
      <Text style={[styles.loadingText, { color: themeColors.primary }]}>
        {isMasculine ? 'Invocando poderes heróicos...' : t.loadingText}
      </Text>

      {/* Pontos animados */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: themeColors.primary },
            ]}
          />
        ))}
      </View>

      {/* Emojis flutuantes */}
      <View style={styles.floatingEmojis}>
        {(isMasculine ? ['🦸', '💪', '🔥'] : ['🧁', '🍰', '🍭']).map((emoji, index) => (
          <Text key={index} style={styles.floatingEmoji}>
            {emoji}
          </Text>
        ))}
      </View>

      {/* Barra de progresso */}
      <View style={[styles.progressBar, { backgroundColor: themeColors.secondary }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: themeColors.primary,
              width: progressWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  wand: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  sparklesContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 24,
  },
  loadingText: {
    fontSize: fonts.sizes.xl,
    fontWeight: 'bold',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  floatingEmojis: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  floatingEmoji: {
    fontSize: 40,
  },
  progressBar: {
    width: '80%',
    height: 12,
    borderRadius: 6,
    marginTop: spacing.xl,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
});
