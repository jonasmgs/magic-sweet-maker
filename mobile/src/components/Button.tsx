/**
 * Componente de Botão Customizado
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
import { getThemeColors, borderRadius, spacing, fonts, shadows } from '../utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
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

  const sizeStyles = {
    sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
    lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
  };

  const fontSizes = {
    sm: fonts.sizes.sm,
    md: fonts.sizes.md,
    lg: fonts.sizes.lg,
  };

  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[{ opacity: isDisabled ? 0.6 : 1 }, style]}
      >
        <LinearGradient
          colors={themeColors.gradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            sizeStyles[size],
            shadows.md,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={[styles.buttonText, { fontSize: fontSizes[size] }, textStyle]}>
              {icon} {title}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
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
      activeOpacity={0.8}
      style={[
        styles.button,
        { backgroundColor: themeColors.secondary, opacity: isDisabled ? 0.6 : 1 },
        sizeStyles[size],
        shadows.sm,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={themeColors.text} />
      ) : (
        <Text style={[styles.buttonText, { color: themeColors.text, fontSize: fontSizes[size] }, textStyle]}>
          {icon} {title}
        </Text>
      )}
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
    fontWeight: 'bold',
    textAlign: 'center',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  outlineText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
