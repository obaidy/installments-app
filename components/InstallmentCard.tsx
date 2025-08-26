import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '../components/ui/Button';
import { useColorScheme } from '@/hooks/useColorScheme';
import { palette, spacing } from '../constants/design';

export type InstallmentCardProps = {
  amount: string;
  dueDate: string;
  status: string;
  onPay?: () => void;
};

export function InstallmentCard({ amount, dueDate, status, onPay }: InstallmentCardProps) {
  const theme = useColorScheme() ?? 'light';
  const backgroundColor = palette[theme].background;
  const borderColor = palette[theme].primary;
  const isPayable = status.toLowerCase() === 'pending';

  return (
    <View style={[styles.card, { backgroundColor, borderColor }]}> 
      <ThemedText>Amount: {amount}</ThemedText>
      <ThemedText>Due date: {dueDate}</ThemedText>
      <ThemedText>Status: {status}</ThemedText>
      <Button title="Pay now" onPress={onPay} disabled={!isPayable} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
  },
});
