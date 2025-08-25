/**
 * Colors used throughout the app. Values are derived from the design palette.
 */

import { palette } from '../constants/design';

export const Colors = {
  light: {
     text: palette.light.text,
    background: palette.light.background,
    primary: palette.light.primary,
    secondary: palette.light.secondary,
    accent: palette.light.accent,
    tint: palette.light.primary,
    icon: palette.light.icon,
    tabIconDefault: palette.light.icon,
    tabIconSelected: palette.light.primary,
  },
  dark: {
    text: palette.dark.text,
    background: palette.dark.background,
    primary: palette.dark.primary,
    secondary: palette.dark.secondary,
    accent: palette.dark.accent,
    tint: palette.dark.primary,
    icon: palette.dark.icon,
    tabIconDefault: palette.dark.icon,
    tabIconSelected: palette.dark.primary,
  },
} as const;

export type ColorTokens = keyof typeof Colors.light;

