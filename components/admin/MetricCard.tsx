import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export function MetricCard({ label, value }: { label: string; value: string | number }) {
  const theme = useColorScheme() ?? 'light';
  return (
    <View style={[styles.card, { backgroundColor: Colors[theme].surface, borderColor: Colors[theme].icon }]}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText type="title">{String(value)}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 140,
  },
  label: {
    opacity: 0.7,
    marginBottom: 6,
  },
});

