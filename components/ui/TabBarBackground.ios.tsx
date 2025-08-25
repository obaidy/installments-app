import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';

import { palette } from '../../constants/design';
import { useColorScheme } from '@/hooks/useColorScheme';


export default function BlurTabBarBackground() {
  const theme = useColorScheme() ?? 'light';
  const backgroundColor =
    theme === 'dark'
      ? `${palette.backgroundDark}cc`
      : `${palette.backgroundLight}cc`;
  return (
    <BlurView
      tint={theme}
      intensity={50}
      style={[StyleSheet.absoluteFill, { backgroundColor }]}
    />
  );
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}
