import { ActivityIndicator, StyleProp, StyleSheet, TextStyle, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useColorScheme } from '../../hooks/useColorScheme';
import { palette, spacing } from '../../constants/design';

export type ButtonProps = TouchableOpacityProps & {
  /** Button label */
  title: string;
  /** Show loading indicator */
  loading?: boolean;
  /** Visual style variant */
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({
  title,
  onPress,
  disabled,
  loading = false,
  variant = 'primary',
  style,
  textStyle,
  ...rest
}: ButtonProps) {
  const theme = useColorScheme() ?? 'light';
  const backgroundColor =
    variant === 'secondary'
      ? palette[theme].secondary
      : palette[theme].primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor, opacity: disabled || loading ? 0.6 : 1 },
        style,
      ]}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <ThemedText type="defaultSemiBold" style={[styles.text, textStyle]}>
          {title}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  text: {
    color: '#fff',
  },
});
