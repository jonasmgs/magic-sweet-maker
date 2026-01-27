/**
 * Tela de Histórico de Sobremesas
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';
import { dessertService } from '../services/api';
import { getThemeColors, fonts, spacing, borderRadius, shadows } from '../utils/theme';

interface DessertItem {
  id: number;
  name: string;
  image_url: string;
  created_at: string;
  ingredients: string;
  recipe: {
    ingredients: string[];
    steps: string[];
  };
}

export function HistoryScreen() {
  const [desserts, setDesserts] = useState<DessertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const { theme, t, language } = useLanguage();
  const themeColors = getThemeColors(theme);
  const isMasculine = theme === 'masculine';

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setError(null);
      const response = await dessertService.getHistory();
      if (response.success && Array.isArray(response.desserts)) {
        setDesserts(response.desserts);
      } else {
        setDesserts([]);
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      setError(
        language === 'pt'
          ? 'Erro ao carregar histórico. Tente novamente.'
          : 'Failed to load history. Try again.'
      );
      setDesserts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const handlePress = (dessert: DessertItem) => {
    navigation.navigate('Result', {
      recipe: {
        name: dessert.name,
        image: dessert.image_url,
        ingredients: dessert.recipe.ingredients,
        steps: dessert.recipe.steps,
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: DessertItem }) => (
    <TouchableOpacity
      onPress={() => handlePress(item)}
      style={[styles.card, { backgroundColor: themeColors.card }, shadows.md]}
    >
      <Image source={{ uri: item.image_url }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: themeColors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.cardDate, { color: themeColors.textSecondary }]}>
          {formatDate(item.created_at)}
        </Text>
      </View>
      <Text style={styles.cardArrow}>›</Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    // Se há erro, mostra mensagem de erro com opção de retry
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>😕</Text>
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={loadHistory}
            style={[styles.retryButton, { backgroundColor: themeColors.primary }]}
          >
            <Text style={styles.retryText}>
              {language === 'pt' ? 'Tentar novamente' : 'Try again'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>{isMasculine ? '🦸' : '🧁'}</Text>
        <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
          {language === 'pt'
            ? 'Nenhuma sobremesa criada ainda!\nVamos criar a primeira?'
            : 'No desserts created yet!\nLet\'s create the first one?'}
        </Text>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={isMasculine ? ['#0F0F1A', '#1A1A2E', '#16213E'] : ['#87CEEB', '#E0F6FF', '#FFF5E1']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>{t.history}</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            {language === 'pt' ? `${desserts.length} sobremesas` : `${desserts.length} desserts`}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.primary} />
          </View>
        ) : (
          <FlatList
            data={desserts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={themeColors.primary}
              />
            }
          />
        )}
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
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fonts.sizes.xxl,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: fonts.sizes.md,
    marginTop: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: 'bold',
  },
  cardDate: {
    fontSize: fonts.sizes.sm,
    marginTop: spacing.xs,
  },
  cardArrow: {
    fontSize: 24,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: fonts.sizes.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: fonts.sizes.md,
    fontWeight: 'bold',
  },
});
