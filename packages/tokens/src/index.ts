// Shared design tokens for both Expo (React Native) and admin-web (Next.js)
// Colors are Stripe-inspired: deep navy foreground, soft background, vibrant indigo primary.

export const palette = {
  light: {
    background: '#F6F9FC',
    surface: '#FFFFFF',
    text: '#0A2540',
    primary: '#635BFF',
    secondary: '#00D4FF',
    accent: '#7A5AF8',
    icon: '#6B7280',
    border: '#E5E7EB'
  },
  dark: {
    background: '#0A2540',
    surface: '#111827',
    text: '#F8FAFC',
    primary: '#635BFF',
    secondary: '#00D4FF',
    accent: '#22D3EE',
    icon: '#9CA3AF',
    border: '#374151'
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const primitives = {
  sizes: {
    inputHeight: 44,
    logo: 80,
  },
  radius: {
    sm: 12,
    md: 10,
    lg: 12,
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
} as const;

export const status = {
  // Useful semantic colors if needed later
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
} as const;

export const fonts = {
  // React Native font family names
  rn: {
    interRegular: 'Inter-Regular',
    interSemiBold: 'Inter-SemiBold',
    poppinsRegular: 'Poppins-Regular',
    poppinsSemiBold: 'Poppins-SemiBold',
    poppinsBold: 'Poppins-Bold',
  },
  // Web font stack suggestions
  web: {
    sans: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'",
  },
} as const;

export const rnDesignTokens = {
  spacing: {
    screen: 24,
    element: 16,
    inputHorizontal: 8,
  },
  sizes: primitives.sizes,
  radius: primitives.radius,
  border: primitives.border,
  shadows: primitives.shadows,
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
} as const;

export type Palette = typeof palette;
export type Spacing = typeof spacing;

