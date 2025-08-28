import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { PrimaryButton } from '../../components/form/PrimaryButton';
import { useToast } from '../../components/Toast';
import { Layout } from '../../constants/Layout';
import { supabase } from '../../lib/supabaseClient';
import { ThemedText } from '../../components/ThemedText';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type Due = {
  id: number;
  unit_id?: number;
  amount_iqd: number;
  due_date: string | null;
  paid: boolean;
};

export default function CheckoutScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();
  const toast = useToast();

  const [due, setDue] = useState<Due | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDue() {
      if (!id || !type) return;
      setLoading(true);
      toast.show('Loading due item...');
      const table = type === 'service_fee' ? 'service_fees' : 'installments';
      const { data, error } = await supabase
        .from(table)
        .select('id, unit_id, amount_iqd, due_date, paid')
        .eq('id', id)
        .single();
      setLoading(false);
      if (error || !data) {
        toast.show('No due item found');
        setDue(null);
        return;
      }
      setDue(data as Due);
    }
     fetchDue();
  }, [id, type, toast]);

  async function handlePayment() {
    if (!due) {
      toast.show('No due item to pay');
      return;
    }

    try {
      const metadata: Record<string, string> = { unit_id: String(due.unit_id || '') };
      if (type === 'service_fee') metadata.service_fee_id = String(due.id);
      else metadata.installment_id = String(due.id);

      const response = await fetch(`${API_URL}/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountIQD: due.amount_iqd,
          description: type,
          metadata,
          target_type: type === 'service_fee' ? 'service_fee' : 'installment',
          target_id: due.id,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Payment failed');
      toast.show('Payment successful: ' + result.status);
    } catch (err: any) {
      toast.show(err.message);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  if (!due) {
    return (
      <View style={styles.container}>
        <ThemedText>No pending items</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Checkout</ThemedText>
      <ThemedText>Amount: {due.amount_iqd}</ThemedText>
      <ThemedText>
        Due: {due.due_date ? new Date(due.due_date).toLocaleDateString() : ''}
      </ThemedText>
      <ThemedText>Paid: {due.paid ? 'Yes' : 'No'}</ThemedText>
      <PrimaryButton title="Pay Now" onPress={handlePayment} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: Layout.screenPadding, gap: 12 },
});
