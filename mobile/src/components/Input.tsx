/**
 * Componente de Input Customizado
 */

import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { getThemeColors, borderRadius, spacing, fonts, shadows } from '../utils/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, style, ...props }: InputProps) {
  const { theme } = useLanguage();
  const themeColors = getThemeColors(theme);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: themeColors.text }]}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: themeColors.card,
            color: themeColors.text,
            borderColor: error ? themeColors.error : themeColors.secondary,
          },
          shadows.sm,
          style,
        ]}
        placeholderTextColor={themeColors.textSecondary}
        {...props}
      />
      {error && (
        <Text style={[styles.error, { color: themeColors.error }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fonts.sizes.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 2,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fonts.sizes.md,
  },
  error: {
    fontSize: fonts.sizes.xs,
    marginTop: spacing.xs,
  },
});
