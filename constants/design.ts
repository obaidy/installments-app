export const palette = {
  primary: '#0a7ea4',
  secondary: '#ff6b6b',
  textLight: '#11181C',
  textDark: '#ECEDEE',
  backgroundLight: '#ffffff',
  backgroundDark: '#151718',
  iconLight: '#687076',
  iconDark: '#9BA1A6',
},
DesignTokens = {
  spacing: {
    screen: 24,
    element: 16,
    inputHorizontal: 8,
  },
  sizes: {
    inputHeight: 40,
    logo: 80,
  },
  radius: {
    sm: 8,
  },
  border: {
    width: 1,
  },
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