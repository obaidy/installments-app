import { StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText';

export type PrimaryButtonProps = TouchableOpacityProps & {
  title: string;
};

export function PrimaryButton({ title, style, ...rest }: PrimaryButtonProps) {
  const theme = useColorScheme() ?? 'light';
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: Colors[theme].tint }, style]}
      activeOpacity={0.8}
      {...rest}
    >
      <ThemedText style={styles.text}>{title}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});