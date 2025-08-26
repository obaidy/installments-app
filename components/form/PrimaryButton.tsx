import {
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  type ColorValue,
} from 'react-native';
import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { palette, DesignTokens } from '../../constants/design';

export type PrimaryButtonProps = TouchableOpacityProps & {
  /**
   * Text displayed inside the button
   */
  title: string;
  /**
   * Optional array of at least two colors for a linear gradient background.
   * When provided, the button will render a gradient instead of a solid color.
   */
  gradientColors?: [string, string, ...string[]];
};

export function PrimaryButton({
  title,
  gradientColors,
  style,
  ...rest
}: PrimaryButtonProps) {
  const theme = useColorScheme() ?? 'light';
  const { primary, secondary } = palette[theme];

  const colors: [ColorValue, ColorValue, ...ColorValue[]] =
    gradientColors && gradientColors.length >= 2
      ? gradientColors
      : [primary, secondary, primary];

  // Base styles applied to the TouchableOpacity regardless of background type
  const buttonStyle = [styles.button, style];

  let GradientBackground: ReactNode = (
    <LinearGradient colors={colors} style={StyleSheet.absoluteFill} />
  );

  return (
    <TouchableOpacity
      style={buttonStyle}
      activeOpacity={0.8}
      accessibilityRole="button"
      {...rest}
    >
      {GradientBackground}
      <ThemedText type="defaultSemiBold" style={styles.text}>
        {title}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...DesignTokens.shadows.sm,
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
});