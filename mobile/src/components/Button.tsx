/**
 * Componente de Botão - Estilo Pixar/Disney
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { getThemeColors, getThemeShadows, borderRadius, spacing, fonts } from '../utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'cool';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const { theme } = useLanguage();
  const themeColors = getThemeColors(theme);
  const themeShadows = getThemeShadows(theme);

  const sizeStyles = {
    sm: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md },
    md: { paddingVertical: spacing.md + 2, paddingHorizontal: spacing.lg },
    lg: { paddingVertical: spacing.lg - 4, paddingHorizontal: spacing.xl },
  };

  const fontSizes = {
    sm: fonts.sizes.sm,
    md: fonts.sizes.md,
    lg: fonts.sizes.lg,
  };

  const isDisabled = disabled || loading;

  // Gradient colors based on variant
  const getGradientColors = () => {
    switch (variant) {
      case 'secondary':
        return themeColors.gradientAlt as [string, string];
      case 'cool':
        return themeColors.gradientCool as [string, string];
      default:
        return themeColors.gradient as [string, string, ...string[]];
    }
  };

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.7}
        style={[
          styles.button,
          styles.outlineButton,
          { borderColor: themeColors.primary, opacity: isDisabled ? 0.6 : 1 },
          sizeStyles[size],
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={themeColors.primary} />
        ) : (
          <Text style={[styles.outlineText, { color: themeColors.primary, fontSize: fontSizes[size] }, textStyle]}>
            {icon} {title}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        { opacity: isDisabled ? 0.6 : 1 },
        themeShadows.primary,
        style,
      ]}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.button,
          sizeStyles[size],
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size={size === 'lg' ? 'small' : 'small'} />
        ) : (
          <Text style={[styles.buttonText, { fontSize: fontSizes[size] }, textStyle]}>
            {icon ? `${icon} ` : ''}{title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  outlineText: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
