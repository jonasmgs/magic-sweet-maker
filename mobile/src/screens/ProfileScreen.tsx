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
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { userService } from '../services/api';
import { Button } from '../components/Button';
import { getThemeColors, fonts, spacing, borderRadius, shadows } from '../utils/theme';

export function ProfileScreen() {
  const [upgrading, setUpgrading] = useState(false);
  const { user, logout, refreshUser } = useAuth();
  const { theme, t, language, setLanguage, setTheme } = useLanguage();
  const themeColors = getThemeColors(theme);
  const isMasculine = theme === 'masculine';

  const handleUpgrade = async () => {
    Alert.alert(
      language === 'pt' ? 'Fazer Upgrade' : 'Upgrade',
      language === 'pt'
        ? 'Deseja fazer upgrade para o plano Premium? (Simulação)'
        : 'Do you want to upgrade to Premium plan? (Simulation)',
      [
        { text: language === 'pt' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        {
          text: language === 'pt' ? 'Confirmar' : 'Confirm',
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
                'Erro',
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
        { text: language === 'pt' ? 'Cancelar' : 'Cancel', style: 'cancel' },
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
              {user?.name || user?.email?.split('@')[0] || 'Usuário'}
            </Text>
            <Text style={[styles.userEmail, { color: themeColors.textSecondary }]}>
              {user?.email}
            </Text>
            {isPremium && (
              <View style={[styles.premiumBadge, { backgroundColor: '#FFD700' }]}>
                <Text style={styles.premiumBadgeText}>⭐ Premium</Text>
              </View>
            )}
          </View>

          {/* Card de Créditos */}
          <View style={[styles.card, { backgroundColor: themeColors.card }, shadows.md]}>
            <View style={styles.cardRow}>
              <View>
                <Text style={[styles.cardLabel, { color: themeColors.textSecondary }]}>
                  {t.credits}
                </Text>
                <Text style={[styles.cardValue, { color: themeColors.primary }]}>
                  ✨ {user?.credits || 0}
                </Text>
              </View>
              <View>
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

          {/* Configurações */}
          <View style={[styles.card, { backgroundColor: themeColors.card }, shadows.md]}>
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>
              {language === 'pt' ? '⚙️ Configurações' : '⚙️ Settings'}
            </Text>

            {/* Idioma */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                {language === 'pt' ? 'Idioma' : 'Language'}
              </Text>
              <View style={styles.optionButtons}>
                <TouchableOpacity
                  onPress={() => setLanguage('pt')}
                  style={[
                    styles.optionButton,
                    language === 'pt' && { backgroundColor: themeColors.primary + '30' },
                  ]}
                >
                  <Text style={styles.optionText}>🇧🇷 PT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLanguage('en')}
                  style={[
                    styles.optionButton,
                    language === 'en' && { backgroundColor: themeColors.primary + '30' },
                  ]}
                >
                  <Text style={styles.optionText}>🇺🇸 EN</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tema */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                {language === 'pt' ? 'Tema' : 'Theme'}
              </Text>
              <View style={styles.optionButtons}>
                <TouchableOpacity
                  onPress={() => setTheme('feminine')}
                  style={[
                    styles.optionButton,
                    theme === 'feminine' && { backgroundColor: themeColors.primary + '30' },
                  ]}
                >
                  <Text style={styles.optionText}>🧁 {language === 'pt' ? 'Doces' : 'Sweets'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setTheme('masculine')}
                  style={[
                    styles.optionButton,
                    theme === 'masculine' && { backgroundColor: themeColors.primary + '30' },
                  ]}
                >
                  <Text style={styles.optionText}>🦸 {language === 'pt' ? 'Heróis' : 'Heroes'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

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
  cardLabel: {
    fontSize: fonts.sizes.sm,
    marginBottom: spacing.xs,
  },
  cardValue: {
    fontSize: fonts.sizes.xl,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
  },
  upgradeButton: {
    marginTop: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  settingLabel: {
    fontSize: fonts.sizes.md,
  },
  optionButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  optionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  optionText: {
    fontSize: fonts.sizes.sm,
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
