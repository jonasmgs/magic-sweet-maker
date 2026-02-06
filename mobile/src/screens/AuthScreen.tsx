/**
 * Tela de Autenticação (Google/Apple)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';

import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/Button';
import { getThemeColors, fonts, spacing, borderRadius, shadows } from '../utils/theme';

WebBrowser.maybeCompleteAuthSession();

export function AuthScreen() {
  const [loading, setLoading] = useState(false);

  const { loginWithGoogle, loginWithApple } = useAuth();
  const { theme, t, language, setLanguage, setTheme } = useLanguage();
  const themeColors = getThemeColors(theme);
  const isMasculine = theme === 'masculine';

  const languageOptions = [
    { code: 'pt', label: '???? PT' },
    { code: 'en', label: '???? EN' },
    { code: 'es', label: '???? ES' },
    { code: 'fr', label: '???? FR' },
    { code: 'de', label: '???? DE' },
    { code: 'ja', label: '???? JA' },
  ] as const;

  const googleClientIdIos = Constants.expoConfig?.extra?.googleClientIdIos;
  const googleClientIdAndroid = Constants.expoConfig?.extra?.googleClientIdAndroid;
  const googleClientIdWeb = Constants.expoConfig?.extra?.googleClientIdWeb;

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: googleClientIdIos,
    androidClientId: googleClientIdAndroid,
    webClientId: googleClientIdWeb,
  });

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === 'success') {
        const idToken = (response.authentication as any)?.idToken || (response.params as any)?.id_token;
        if (!idToken) {
          Alert.alert(t.errorShort, t.errorGoogleTokenMissing);
          return;
        }
        setLoading(true);
        const result = await loginWithGoogle(idToken);
        if (!result.success) {
          Alert.alert(t.errorShort, result.error || t.errorGoogleLogin);
        }
        setLoading(false);
      }
    };

    handleGoogleResponse();
  }, [response, language, loginWithGoogle]);

  const handleGoogleLogin = async () => {
    try {
      await promptAsync();
    } catch {
      Alert.alert(t.errorShort, t.errorGoogleOpen);
    }
  };

  const handleAppleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        Alert.alert(t.errorShort, t.errorAppleTokenMissing);
        return;
      }
      setLoading(true);
      const result = await loginWithApple(credential.identityToken);
      if (!result.success) {
        Alert.alert(t.errorShort, result.error || t.errorAppleLogin);
      }
      setLoading(false);
    } catch (err: any) {
      if (err?.code !== 'ERR_CANCELED') {
        Alert.alert(t.errorShort, t.errorAppleLogin);
      }
    }
  };

  return (
    <LinearGradient
      colors={isMasculine ? ['#0F0F1A', '#1A1A2E', '#16213E'] : ['#FF6B9D', '#FFA07A', '#FFB6C1']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header com opções */}
            <View style={styles.header}>
              <View style={styles.languageButtons}>
                {languageOptions.map(option => (
                  <TouchableOpacity
                    key={option.code}
                    onPress={() => setLanguage(option.code)}
                    style={[styles.langButton, language === option.code && styles.langButtonActive]}
                  >
                    <Text style={styles.langText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.themeButtons}>
                <TouchableOpacity
                  onPress={() => setTheme('feminine')}
                  style={[styles.themeButton, theme === 'feminine' && styles.themeButtonActive]}
                >
                  <Text style={styles.themeText}>🧁</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setTheme('masculine')}
                  style={[styles.themeButton, theme === 'masculine' && styles.themeButtonActive]}
                >
                  <Text style={styles.themeText}>🦸</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Logo e Título */}
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>{isMasculine ? '🦸‍♂️' : '🧁'}</Text>
              <Text style={[styles.title, { color: '#FFFFFF' }]}>{t.title}</Text>
              <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                {t.subtitle}
              </Text>
            </View>

            {/* Login Social */}
            <View style={[styles.form, { backgroundColor: themeColors.card }, shadows.lg]}>
              <Text style={[styles.formTitle, { color: themeColors.text }]}>
                {t.login}
              </Text>

              <Button
                title={t.continueWithGoogle}
                onPress={handleGoogleLogin}
                loading={loading}
                icon="G"
                size="lg"
                style={styles.submitButton}
                disabled={!request}
              />

              {Platform.OS === 'ios' && (
                <View style={styles.appleButtonWrapper}>
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={12}
                    style={styles.appleButton}
                    onPress={handleAppleLogin}
                  />
                </View>
              )}

              <Text style={[styles.helperText, { color: themeColors.textSecondary }]}>
                {t.authProvidersOnly}
              </Text>
            </View>

            {/* Emojis decorativos */}
            <View style={styles.emojisContainer}>
              {(isMasculine ? ['⚡', '💪', '🔥', '⭐', '🌟'] : ['🍰', '🍭', '🍫', '🍓', '🍦']).map(
                (emoji, index) => (
                  <Text key={index} style={styles.decorEmoji}>
                    {emoji}
                  </Text>
                )
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  languageButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    flex: 1,
  },
  langButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  langText: {
    fontSize: fonts.sizes.sm,
    color: '#FFFFFF',
  },
  themeButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  themeButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  themeButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  themeText: {
    fontSize: fonts.sizes.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fonts.sizes.title,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: fonts.sizes.md,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  form: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  formTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  appleButtonWrapper: {
    marginTop: spacing.md,
  },
  appleButton: {
    width: '100%',
    height: 48,
  },
  helperText: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emojisContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  decorEmoji: {
    fontSize: 32,
  },
});
