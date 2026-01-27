/**
 * Componente de Seleção de Idioma
 *
 * Modal bonito para selecionar entre os 12 idiomas suportados.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage, Language, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import { spacing, fonts, borderRadius, shadows, getThemeColors } from '../theme';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguageSelector({ visible, onClose }: LanguageSelectorProps) {
  const { language, setLanguage, theme, t } = useLanguage();
  const themeColors = getThemeColors(theme);
  const isMasculine = theme === 'masculine';

  const handleSelectLanguage = async (lang: Language) => {
    await setLanguage(lang);
    onClose();
  };

  const gradientColors = isMasculine
    ? ['#0F0F1A', '#1A1A2E', '#16213E'] as const
    : ['#87CEEB', '#E0F6FF', '#FFF5E1'] as const;

  const headerGradient = isMasculine
    ? ['#667EEA', '#764BA2'] as const
    : ['#FF6B9D', '#FFA07A'] as const;

  const renderLanguageItem = ({ item }: { item: typeof SUPPORTED_LANGUAGES[0] }) => {
    const isSelected = item.code === language;

    return (
      <TouchableOpacity
        style={[
          styles.languageItem,
          {
            backgroundColor: isSelected
              ? isMasculine
                ? 'rgba(102, 126, 234, 0.3)'
                : 'rgba(255, 107, 157, 0.2)'
              : themeColors.card,
            borderColor: isSelected ? themeColors.primary : 'transparent',
            borderWidth: isSelected ? 2 : 0,
          },
          shadows.sm,
        ]}
        onPress={() => handleSelectLanguage(item.code)}
        activeOpacity={0.7}
      >
        <Text style={styles.flag}>{item.flag}</Text>
        <View style={styles.languageInfo}>
          <Text style={[styles.nativeName, { color: themeColors.text }]}>
            {item.nativeName}
          </Text>
          <Text style={[styles.englishName, { color: themeColors.textSecondary }]}>
            {item.name}
          </Text>
        </View>
        {isSelected && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <LinearGradient colors={gradientColors} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <LinearGradient
            colors={headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isMasculine ? '🌍' : '🌸'} {t.selectLanguage}
            </Text>
            <View style={styles.placeholder} />
          </LinearGradient>

          {/* Language List */}
          <FlatList
            data={SUPPORTED_LANGUAGES}
            renderItem={renderLanguageItem}
            keyExtractor={(item) => item.code}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={styles.row}
          />
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: spacing.lg,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  languageItem: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    minHeight: 70,
  },
  flag: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  languageInfo: {
    flex: 1,
  },
  nativeName: {
    fontSize: fonts.sizes.md,
    fontWeight: 'bold',
  },
  englishName: {
    fontSize: fonts.sizes.sm,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
