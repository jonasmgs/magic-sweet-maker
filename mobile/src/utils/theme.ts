/**
 * Tema e Cores do App
 */

export const colors = {
  // Tema feminino (doces)
  feminine: {
    primary: '#FF69B4',
    secondary: '#FFB6C1',
    accent: '#FF1493',
    background: '#FFF0F5',
    card: '#FFFFFF',
    text: '#333333',
    textSecondary: '#666666',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FFC107',
    gradient: ['#FF69B4', '#FF1493', '#FFB6C1'],
  },
  // Tema masculino (super-heróis)
  masculine: {
    primary: '#4169E1',
    secondary: '#6A5ACD',
    accent: '#FF4500',
    background: '#1A1A2E',
    card: '#16213E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FFC107',
    gradient: ['#4169E1', '#6A5ACD', '#FF4500'],
  },
};

export const fonts = {
  regular: 'System',
  bold: 'System',
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    title: 40,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export function getThemeColors(theme: 'feminine' | 'masculine') {
  return colors[theme];
}
