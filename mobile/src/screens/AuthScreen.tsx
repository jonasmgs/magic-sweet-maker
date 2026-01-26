/**
 * Tela de Autenticação (Login/Cadastro)
 */

import React, { useState } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { getThemeColors, fonts, spacing, borderRadius, shadows } from '../utils/theme';

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});

  const { login, register } = useAuth();
  const { theme, t, language, setLanguage, setTheme } = useLanguage();
  const themeColors = getThemeColors(theme);
  const isMasculine = theme === 'masculine';

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = language === 'pt' ? 'Email é obrigatório' : 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = language === 'pt' ? 'Email inválido' : 'Invalid email';
    }

    if (!password) {
      newErrors.password = language === 'pt' ? 'Senha é obrigatória' : 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = language === 'pt' ? 'Mínimo 6 caracteres' : 'Minimum 6 characters';
    }

    if (!isLogin && !name) {
      newErrors.name = language === 'pt' ? 'Nome é obrigatório' : 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const result = isLogin
        ? await login(email, password)
        : await register(email, password, name);

      if (!result.success) {
        Alert.alert(
          language === 'pt' ? 'Erro' : 'Error',
          result.error || (language === 'pt' ? 'Algo deu errado' : 'Something went wrong')
        );
      }
    } catch (error) {
      Alert.alert(
        language === 'pt' ? 'Erro' : 'Error',
        language === 'pt' ? 'Erro ao conectar com o servidor' : 'Error connecting to server'
      );
    } finally {
      setLoading(false);
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header com opções */}
            <View style={styles.header}>
              <View style={styles.languageButtons}>
                <TouchableOpacity
                  onPress={() => setLanguage('pt')}
                  style={[styles.langButton, language === 'pt' && styles.langButtonActive]}
                >
                  <Text style={styles.langText}>🇧🇷 PT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLanguage('en')}
                  style={[styles.langButton, language === 'en' && styles.langButtonActive]}
                >
                  <Text style={styles.langText}>🇺🇸 EN</Text>
                </TouchableOpacity>
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

            {/* Formulário */}
            <View style={[styles.form, { backgroundColor: themeColors.card }, shadows.lg]}>
              <Text style={[styles.formTitle, { color: themeColors.text }]}>
                {isLogin ? t.login : t.register}
              </Text>

              {!isLogin && (
                <Input
                  label={t.name}
                  value={name}
                  onChangeText={setName}
                  placeholder={language === 'pt' ? 'Seu nome' : 'Your name'}
                  error={errors.name}
                  autoCapitalize="words"
                />
              )}

              <Input
                label={t.email}
                value={email}
                onChangeText={setEmail}
                placeholder="email@exemplo.com"
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label={t.password}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••"
                error={errors.password}
                secureTextEntry
              />

              <Button
                title={isLogin ? t.login : t.register}
                onPress={handleSubmit}
                loading={loading}
                icon={isMasculine ? '⚡' : '✨'}
                size="lg"
                style={styles.submitButton}
              />

              <TouchableOpacity
                onPress={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                style={styles.switchButton}
              >
                <Text style={[styles.switchText, { color: themeColors.primary }]}>
                  {isLogin ? t.noAccount : t.haveAccount}
                </Text>
              </TouchableOpacity>
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
    gap: spacing.xs,
  },
  langButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
  switchButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  switchText: {
    fontSize: fonts.sizes.md,
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
