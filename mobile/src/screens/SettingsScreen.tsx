/**
 * Tela de Configurações
 *
 * Permite ao usuário alterar idioma e tema.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { spacing, fonts, borderRadius, shadows, getThemeColors } from '../theme';

export function SettingsScreen() {
  const navigation = useNavigation();
  const { language, theme, setTheme, t } = useLanguage();
  const themeColors = getThemeColors(theme);
  const isMasculine = theme === 'masculine';

  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === language);

  const gradientColors = isMasculine
    ? ['#0F0F1A', '#1A1A2E', '#16213E'] as const
    : ['#87CEEB', '#E0F6FF', '#FFF5E1'] as const;

  const handleThemeChange = async (newTheme: 'feminine' | 'masculine') => {
    await setTheme(newTheme);
  };

  return (
    <LinearGradient colors={gradientColors} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: themeColors.card }]}
          >
            <Text style={[styles.backText, { color: themeColors.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: themeColors.text }]}>
            {t.settings}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Language Section */}
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
            {t.language}
          </Text>
          <TouchableOpacity
            style={[styles.settingCard, { backgroundColor: themeColors.card }, shadows.md]}
            onPress={() => setShowLanguageSelector(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.settingIcon}>{currentLanguage?.flag || '🌍'}</Text>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                {currentLanguage?.nativeName || 'English'}
              </Text>
              <Text style={[styles.settingValue, { color: themeColors.textSecondary }]}>
                {currentLanguage?.name || 'English'}
              </Text>
            </View>
            <Text style={[styles.arrow, { color: themeColors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          {/* Theme Section */}
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
            {t.theme}
          </Text>

          {/* Sweets Theme */}
          <TouchableOpacity
            style={[
              styles.themeCard,
              {
                backgroundColor: theme === 'feminine'
                  ? 'rgba(255, 107, 157, 0.2)'
                  : themeColors.card,
                borderColor: theme === 'feminine' ? '#FF6B9D' : 'transparent',
                borderWidth: theme === 'feminine' ? 2 : 0,
              },
              shadows.md,
            ]}
            onPress={() => handleThemeChange('feminine')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#FF6B9D', '#FFA07A']}
              style={styles.themePreview}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.themeEmoji}>🧁</Text>
            </LinearGradient>
            <View style={styles.themeInfo}>
              <Text style={[styles.themeName, { color: themeColors.text }]}>
                {t.sweetsTheme}
              </Text>
              <Text style={[styles.themeDescription, { color: themeColors.textSecondary }]}>
                {t.sweetsDescription}
              </Text>
            </View>
            {theme === 'feminine' && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>

          {/* Heroes Theme */}
          <TouchableOpacity
            style={[
              styles.themeCard,
              {
                backgroundColor: theme === 'masculine'
                  ? 'rgba(102, 126, 234, 0.3)'
                  : themeColors.card,
                borderColor: theme === 'masculine' ? '#667EEA' : 'transparent',
                borderWidth: theme === 'masculine' ? 2 : 0,
              },
              shadows.md,
            ]}
            onPress={() => handleThemeChange('masculine')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#667EEA', '#764BA2']}
              style={styles.themePreview}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.themeEmoji}>⚡</Text>
            </LinearGradient>
            <View style={styles.themeInfo}>
              <Text style={[styles.themeName, { color: themeColors.text }]}>
                {t.heroesTheme}
              </Text>
              <Text style={[styles.themeDescription, { color: themeColors.textSecondary }]}>
                {t.heroesDescription}
              </Text>
            </View>
            {theme === 'masculine' && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
              {isMasculine ? '🦸‍♂️' : '🧚‍♀️'} {t.selectTheme}
            </Text>
          </View>
        </ScrollView>

        {/* Language Selector Modal */}
        <LanguageSelector
          visible={showLanguageSelector}
          onClose={() => setShowLanguageSelector(false)}
        />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: fonts.sizes.xl,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.sizes.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  settingIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: fonts.sizes.md,
    fontWeight: 'bold',
  },
  settingValue: {
    fontSize: fonts.sizes.sm,
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    fontWeight: '300',
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  themePreview: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  themeEmoji: {
    fontSize: 32,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: fonts.sizes.md,
    fontWeight: 'bold',
  },
  themeDescription: {
    fontSize: fonts.sizes.sm,
    marginTop: 4,
  },
  checkmark: {
    fontSize: 24,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  infoSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  infoText: {
    fontSize: fonts.sizes.sm,
    textAlign: 'center',
  },
});
