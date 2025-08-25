import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';

import { palette } from '../../constants/design';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabBarBackground() {
  const theme = useColorScheme() ?? 'light';
  const backgroundColor =
    theme === 'dark'
      ? `${palette.backgroundDark}cc`
      : `${palette.backgroundLight}cc`;
  return (
    <BlurView
      intensity={50}
      tint={theme}
      style={[StyleSheet.absoluteFill, { backgroundColor }]}
    />
  );
}

export function useBottomTabOverflow() {
  return 0;
}
