// 🎨 PALETA DE CORES EMERALD - PANELA APP
// Baseado no Design System do protótipo web

export const colors = {
  // Cores Primárias (Verde Esmeralda)
  emerald: {
    50: '#f0fdf4',   // Fundos suaves, backgrounds de página
    100: '#dcfce7',   // Fundos de destaque, hover states
    200: '#bbf7d0',   // Bordas suaves
    300: '#86efac',   // Acentos leves
    400: '#4ade80',   // Estados intermediários
    500: '#10b981',   // Ícones, links
    600: '#059669',   // Botões primários, headers
    700: '#047857',   // Hover em botões, estados pressed
    800: '#065f46',   // Textos em fundos claros
    900: '#064e3b',   // Títulos, textos importantes
  },
  
  // Cores Secundárias (Verde)
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',   // Usado em gradientes com emerald
    700: '#15803d',
  },
  
  // Cores de Feedback
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    600: '#16a34a',
    700: '#15803d',
  },
  
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    600: '#d97706',
    700: '#b45309',
  },
  
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    600: '#dc2626',
    700: '#b91c1c',
  },
  
  // Cores Neutras (Cinza)
  gray: {
    50: '#f9fafb',   // Background de inputs desabilitados
    100: '#f3f4f6', // Background de cards secundários
    200: '#e5e7eb', // Bordas
    300: '#d1d5db', // Bordas de inputs
    400: '#9ca3af', // Ícones desabilitados, placeholders
    500: '#6b7280', // Textos secundários
    600: '#4b5563', // Textos normais
    700: '#374151', // Textos de destaque
    800: '#1f2937', // Títulos secundários
    900: '#111827', // Títulos principais
  },
  
  // Cores de Texto
  text: {
    primary: '#111827',     // Títulos principais
    secondary: '#6b7280',   // Textos secundários
    muted: '#9ca3af',       // Textos desabilitados
    white: '#ffffff',       // Texto em fundos coloridos
    emerald: '#059669',     // Texto em destaque emerald
  },
  
  // Backgrounds
  background: {
    primary: '#f0fdf4',     // Background principal
    secondary: '#dcfce7',   // Background secundário
    white: '#ffffff',       // Background branco
    light: '#f9fafb',       // Background claro
  },
  
  // Bordas
  border: {
    light: '#e5e7eb',
    medium: '#d1d5db',
    emerald: '#bbf7d0',
  },
  
  // Sombras
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  // Gradientes
  gradient: {
    emerald: ['#059669', '#16a34a'],           // Gradiente principal
    emeraldLight: ['#f0fdf4', '#dcfce7'],     // Gradiente de background
    emeraldAvatar: ['#10b981', '#22c55e'],     // Gradiente para avatares
  },
};

// Cores antigas para referência e migração gradual
export const oldColors = {
  primary: '#059669',
  secondary: '#10b981',
  background: '#f0fdf4',
  backgroundLight: '#dcfce7',
  surface: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  border: '#e5e7eb',
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
};

export default colors;