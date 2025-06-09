import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function StyledInput({ style, ...rest }: TextInputProps) {
  const theme = useColorScheme() ?? 'light';
  return (
    <TextInput
      style={[styles.input, { borderColor: Colors[theme].tint }, style]}
      placeholderTextColor={Colors[theme].icon}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    borderWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
});