import {
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import type { ReactNode } from 'react';
import { ThemedText } from '../ThemedText';
import { useColorScheme } from '../../hooks/useColorScheme';
import { palette, DesignTokens } from '../../constants/design';

export type PrimaryButtonProps = TouchableOpacityProps & {
  /**
   * Text displayed inside the button
   */
  title: string;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ title, style, ...rest }: PrimaryButtonProps) {
  const theme = useColorScheme() ?? 'light';
  const { primary } = palette[theme];

  // Base styles applied to the TouchableOpacity regardless of background type
  // Flatten to avoid nested arrays that can trip RN Web style application
  const buttonStyle = StyleSheet.flatten([
    styles.button,
    { backgroundColor: String(primary) },
    style,
  ]);

  return (
    <TouchableOpacity
      style={StyleSheet.flatten([buttonStyle, styles.relative])}
      activeOpacity={0.8}
      accessibilityRole="button"
      {...rest}
    >
      <ThemedText type="defaultSemiBold" style={styles.text}>
        {title}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  relative: { position: 'relative' },
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
