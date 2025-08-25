/**
 * Colors used throughout the app. Values are derived from the design palette.
 */

import { palette } from '../constants/design';

export const Colors = {
  light: {
     text: palette.textLight,
    background: palette.backgroundLight,
    primary: palette.primary,
    secondary: palette.secondary,
    tint: palette.primary,
    icon: palette.iconLight,
    tabIconDefault: palette.iconLight,
    tabIconSelected: palette.primary,
  },
  dark: {
    text: palette.textDark,
    background: palette.backgroundDark,
    primary: palette.primary,
    secondary: palette.secondary,
    tint: palette.primary,
    icon: palette.iconDark,
    tabIconDefault: palette.iconDark,
    tabIconSelected: palette.primary,
  },
} as const;

export type ColorTokens = keyof typeof Colors.light;

