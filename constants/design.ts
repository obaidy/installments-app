export const palette = {
  light: {
    background: '#F6F9FC',
    surface: '#FFFFFF',
    text: '#0A2540',
    primary: '#635BFF',
    secondary: '#00D4FF',
    accent: '#7A5AF8',
    icon: '#6B7280',
  },
  dark: {
    background: '#0A2540',
    surface: '#111827',
    text: '#F8FAFC',
    primary: '#635BFF',
    secondary: '#00D4FF',
    accent: '#22D3EE',
    icon: '#9CA3AF',
  },
},
DesignTokens = {
  spacing: {
    screen: 24,
    element: 16,
    inputHorizontal: 8,
  },
  sizes: {
    inputHeight: 44,
    logo: 80,
  },
  radius: {
    sm: 12,
  },
  border: {
    width: 1,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
  },
  /**
   * Opacity hex value appended to base text color to create placeholder text color (~60% opacity).
   */
  placeholderColor: '99',
  colors: {
    light: {
      background: '#f4f8fb',
      border: '#ccc',
      error: '#b00020',
    },
    dark: {
      background: '#1a1a1a',
      border: '#555',
      error: '#cf6679',
    },
  },
  typography: {
    error: {
      fontSize: 14,
      fontWeight: '600' as const,
    },
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const fonts = {
  interRegular: 'Inter-Regular',
  interSemiBold: 'Inter-SemiBold',
  poppinsRegular: 'Poppins-Regular',
  poppinsSemiBold: 'Poppins-SemiBold',
  poppinsBold: 'Poppins-Bold',
};

export type Palette = typeof palette;
export type Spacing = typeof spacing;
export type Fonts = typeof fonts;
