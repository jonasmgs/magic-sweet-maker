/**
 * Tela de Perfil - Créditos e Configurações
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
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import { userService } from '../services/api';
import { Button } from '../components/Button';
import { getThemeColors, fonts, spacing, borderRadius, shadows } from '../utils/theme';

export function ProfileScreen() {
  const [upgrading, setUpgrading] = useState(false);
  const navigation = useNavigation<any>();
  const { user, logout, refreshUser } = useAuth();
  const { theme, t, language } = useLanguage();
  const themeColors = getThemeColors(theme);
  const isMasculine = theme === 'masculine';

  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === language);

  const handleUpgrade = async () => {
    Alert.alert(
      t.upgrade,
      language === 'pt'
        ? 'Deseja fazer upgrade para o plano Premium? (Simulação)'
        : 'Do you want to upgrade to Premium plan? (Simulation)',
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.confirm,
          onPress: async () => {
            setUpgrading(true);
            try {
              await userService.upgrade();
              await refreshUser();
              Alert.alert(
                '🎉',
                language === 'pt'
                  ? 'Parabéns! Você agora é Premium!'
                  : 'Congratulations! You are now Premium!'
              );
            } catch (error) {
              Alert.alert(
                t.error,
                language === 'pt' ? 'Erro ao fazer upgrade' : 'Error upgrading'
              );
            } finally {
              setUpgrading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t.logout,
      language === 'pt' ? 'Deseja sair da conta?' : 'Do you want to logout?',
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.logout,
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const isPremium = user?.plan === 'premium';

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
            <Text style={[styles.title, { color: themeColors.text }]}>{t.profile}</Text>
          </View>

          {/* Avatar e Nome */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, { backgroundColor: themeColors.primary }]}>
              <Text style={styles.avatarEmoji}>{isMasculine ? '🦸' : '🧁'}</Text>
            </View>
            <Text style={[styles.userName, { color: themeColors.text }]}>
              {user?.name || user?.email?.split('@')[0] || 'User'}
            </Text>
            <Text style={[styles.userEmail, { color: themeColors.textSecondary }]}>
              {user?.email}
            </Text>
            {isPremium && (
              <View style={[styles.premiumBadge, { backgroundColor: '#FFD700' }]}>
                <Text style={styles.premiumBadgeText}>⭐ {t.premium}</Text>
              </View>
            )}
          </View>

          {/* Card de Créditos */}
          <View style={[styles.card, { backgroundColor: themeColors.card }, shadows.md]}>
            <View style={styles.cardRow}>
              <View style={styles.cardItem}>
                <Text style={[styles.cardLabel, { color: themeColors.textSecondary }]}>
                  {t.credits}
                </Text>
                <Text style={[styles.cardValue, { color: themeColors.primary }]}>
                  ✨ {user?.credits || 0}
                </Text>
              </View>
              <View style={styles.cardItem}>
                <Text style={[styles.cardLabel, { color: themeColors.textSecondary }]}>
                  {t.plan}
                </Text>
                <Text style={[styles.cardValue, { color: themeColors.text }]}>
                  {isPremium ? '⭐ Premium' : '🆓 ' + t.free}
                </Text>
              </View>
            </View>

            {!isPremium && (
              <Button
                title={t.upgrade + ' ⭐'}
                onPress={handleUpgrade}
                loading={upgrading}
                size="md"
                style={styles.upgradeButton}
              />
            )}
          </View>

          {/* Card de Configurações */}
          <TouchableOpacity
            style={[styles.settingsCard, { backgroundColor: themeColors.card }, shadows.md]}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRow}>
              <Text style={styles.settingsIcon}>⚙️</Text>
              <View style={styles.settingsInfo}>
                <Text style={[styles.settingsTitle, { color: themeColors.text }]}>
                  {t.settings}
                </Text>
                <Text style={[styles.settingsSubtitle, { color: themeColors.textSecondary }]}>
                  {currentLanguage?.flag} {currentLanguage?.nativeName} • {isMasculine ? t.heroesTheme : t.sweetsTheme}
                </Text>
              </View>
              <Text style={[styles.arrow, { color: themeColors.textSecondary }]}>›</Text>
            </View>
          </TouchableOpacity>

          {/* Botão de Logout */}
          <Button
            title={t.logout}
            onPress={handleLogout}
            variant="outline"
            size="lg"
            style={styles.logoutButton}
          />

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: themeColors.textSecondary }]}>
              Made with 💖 for little {isMasculine ? 'heroes' : 'chefs'} {isMasculine ? '🦸' : '👨‍🍳'}
            </Text>
            <Text style={[styles.versionText, { color: themeColors.textSecondary }]}>
              v1.0.0
            </Text>
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
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fonts.sizes.xxl,
    fontWeight: 'bold',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarEmoji: {
    fontSize: 50,
  },
  userName: {
    fontSize: fonts.sizes.xl,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: fonts.sizes.md,
    marginTop: spacing.xs,
  },
  premiumBadge: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  premiumBadgeText: {
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cardItem: {
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: fonts.sizes.sm,
    marginBottom: spacing.xs,
  },
  cardValue: {
    fontSize: fonts.sizes.xl,
    fontWeight: 'bold',
  },
  upgradeButton: {
    marginTop: spacing.lg,
  },
  settingsCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  settingsInfo: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: 'bold',
  },
  settingsSubtitle: {
    fontSize: fonts.sizes.sm,
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    fontWeight: '300',
  },
  logoutButton: {
    marginBottom: spacing.xl,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: fonts.sizes.sm,
    textAlign: 'center',
  },
  versionText: {
    fontSize: fonts.sizes.xs,
    marginTop: spacing.xs,
  },
});
