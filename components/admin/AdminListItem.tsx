import { PropsWithChildren } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

export function AdminListItem({ children, style }: PropsWithChildren<{ style?: any }>) {
  const { width } = useWindowDimensions();
  const isWide = width >= 600;
  return (
    <View style={[styles.card, isWide && styles.row, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});