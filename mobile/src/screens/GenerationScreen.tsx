/**
 * Tela de Geração - Loading Animado
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dessertService } from '../services/api';
import { LoadingAnimation } from '../components/LoadingAnimation';
import { getThemeColors } from '../utils/theme';

export function GenerationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { refreshUser } = useAuth();
  const { theme, language, t } = useLanguage();
  const themeColors = getThemeColors(theme);
  const isMasculine = theme === 'masculine';

  const { ingredients } = route.params || {};

  useEffect(() => {
    generateDessert();
  }, []);

  const generateDessert = async () => {
    try {
      const response = await dessertService.generate(ingredients, theme, language);

      if (response.success && response.recipe) {
        // Atualizar créditos do usuário
        await refreshUser();

        // Navegar para resultado
        navigation.replace('Result', { recipe: response.recipe });
      } else {
        throw new Error('Erro ao gerar sobremesa');
      }
    } catch (error: any) {
      console.error('Erro na geração:', error);

      const errorData = error.response?.data;
      let errorMessage = t.generateErrorDefault;\n
      if (errorData?.errorType === 'credits') {\n        errorMessage = t.generateErrorCredits;\n      } else if (errorData?.errorType === 'rate-limit') {\n        errorMessage = t.generateErrorRateLimit;\n      }

      Alert.alert(
        t.oopsTitle,
        errorMessage,
        [
          {
            text: t.ok,
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  return (
    <LinearGradient
      colors={isMasculine ? ['#0F0F1A', '#1A1A2E', '#16213E'] : ['#87CEEB', '#E0F6FF', '#FFF5E1']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <LoadingAnimation />
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
});
