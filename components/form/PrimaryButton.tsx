import { StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText';

export type PrimaryButtonProps = TouchableOpacityProps & {
  /**
   * Text displayed inside the button
   */
  title: string;
  /**
   * Optional array of colors for a linear gradient background.
   * When provided, the button will render a gradient instead of a solid color.
   */
  gradientColors?: string[];
};

export function PrimaryButton({
  title,
  gradientColors,
  style,
  ...rest
}: PrimaryButtonProps) {
  const theme = useColorScheme() ?? 'light';

  // Base styles applied to the TouchableOpacity regardless of background type
  const buttonStyle = [styles.button, style];

  // When gradient colors are provided, render a gradient background.
    let GradientBackground: ReactNode = null;
    if (gradientColors && gradientColors.length > 0) {
    GradientBackground = (
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />
    );
  } else {
    buttonStyle.unshift({ backgroundColor: Colors[theme].tint });
  }

  return (
    <TouchableOpacity style={buttonStyle} activeOpacity={0.8} {...rest}>
      {GradientBackground}
      <ThemedText style={styles.text}>{title}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});