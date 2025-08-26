import {
  StyleSheet,
  TextInput,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useState } from 'react';
import { DesignTokens } from '../../constants/design';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export type StyledInputProps = TextInputProps & {
  /**
   * Visual style of the input. `outlined` shows a border while
   * `filled` uses a subtle background color.
   */
  variant?: 'filled' | 'outlined';
};

export function StyledInput({
  style,
  variant = 'outlined',
  onFocus,
  onBlur,
  ...rest
}: StyledInputProps) {
  const theme = useColorScheme() ?? 'light';
  const [focused, setFocused] = useState(false);
  const placeholderColor = `${Colors[theme].text}${DesignTokens.placeholderColor}`;
  const inputStyles: ViewStyle[] = [
    styles.input,
    {
      borderColor: focused ? Colors[theme].tint : Colors[theme].icon,
    },
  ];

  if (variant === 'filled') {
    inputStyles.push({
      backgroundColor: `${Colors[theme].tint}20`,
      borderWidth: 0,
    });
  } else {
    inputStyles.push({
      backgroundColor: 'transparent',
      borderWidth: 1,
    });
  }

  return (
    <TextInput
       style={[{ color: Colors[theme].text }, ...inputStyles, style]}
      placeholderTextColor={placeholderColor}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: DesignTokens.sizes.inputHeight,
    borderWidth: DesignTokens.border.width,
    paddingHorizontal: DesignTokens.spacing.inputHorizontal,
    borderRadius: DesignTokens.radius.sm,
  },
});