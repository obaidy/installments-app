import {
  palette as sharedPalette,
  spacing as sharedSpacing,
  rnDesignTokens,
  fonts as sharedFonts,
} from '@installments/tokens';

export const palette = sharedPalette;

export const DesignTokens = rnDesignTokens;

export const spacing = sharedSpacing;

export const fonts = sharedFonts.rn;

export type Palette = typeof sharedPalette;
export type Spacing = typeof sharedSpacing;
export type Fonts = typeof sharedFonts.rn;
