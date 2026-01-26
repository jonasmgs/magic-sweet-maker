/**
 * Tema Pixar/Disney - Cores vibrantes e mágicas
 */

export const colors = {
  // Tema feminino (Doces Mágicos 🧁)
  feminine: {
    primary: '#FF6B9D',
    secondary: '#FFB6C1',
    accent: '#FF1493',
    background: '#FFF5F8',
    card: '#FFFFFF',
    text: '#333333',
    textSecondary: '#6B7280',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FFC107',
    gradient: ['#FF6B9D', '#FFA07A', '#FFB6C1'],
    gradientAlt: ['#667EEA', '#764BA2'],
    gradientCool: ['#48C6EF', '#6F86D6'],
  },
  // Tema masculino (Super-Heróis ⚡)
  masculine: {
    primary: '#667EEA',
    secondary: '#764BA2',
    accent: '#FF6B35',
    background: '#0F0F1A',
    card: '#1A1A2E',
    text: '#FFFFFF',
    textSecondary: '#A0AEC0',
    success: '#48BB78',
    error: '#F56565',
    warning: '#ECC94B',
    gradient: ['#667EEA', '#764BA2', '#6B8DD6'],
    gradientAlt: ['#FF6B35', '#F7931E'],
    gradientCool: ['#00D9FF', '#00FF94'],
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
    title: 42,
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
  sm: 12,
  md: 20,
  lg: 30,
  full: 9999,
};

// Sombras coloridas estilo Pixar
export const shadows = {
  sm: {
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  md: {
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  lg: {
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
};

// Sombras por tema
export const themeShadows = {
  feminine: {
    primary: {
      shadowColor: '#FF6B9D',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 15,
      elevation: 10,
    },
    card: {
      shadowColor: '#FF6B9D',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 15,
    },
  },
  masculine: {
    primary: {
      shadowColor: '#667EEA',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 15,
      elevation: 10,
    },
    card: {
      shadowColor: '#764BA2',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 15,
    },
  },
};

export function getThemeColors(theme: 'feminine' | 'masculine') {
  return colors[theme];
}

export function getThemeShadows(theme: 'feminine' | 'masculine') {
  return themeShadows[theme];
}
