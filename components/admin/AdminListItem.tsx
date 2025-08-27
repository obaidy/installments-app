import { PropsWithChildren } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { StyleSheet as RNWStyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export function AdminListItem({ children, style }: PropsWithChildren<{ style?: any }>) {
  const { width } = useWindowDimensions();
  const theme = useColorScheme() ?? 'light';
  const isWide = width >= 600;
  const cardStyles = [
    styles.card,
    {
      backgroundColor: Colors[theme].surface,
      borderColor: Colors[theme].icon,
    },
    isWide && styles.row,
    style,
  ].filter(Boolean);
  return <View style={RNWStyleSheet.flatten(cardStyles)}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
