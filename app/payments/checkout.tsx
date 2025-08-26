import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { PrimaryButton } from '../../components/form/PrimaryButton';
import { useToast } from '../../components/Toast';
import { Layout } from '../../constants/Layout';
import { supabase } from '../../lib/supabaseClient';
import { ThemedText } from '@/components/ThemedText';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type Installment = {
  id: number;
  amount: number;
  due_date: string | null;
  status: string;
};

export default function CheckoutScreen() {
  const { unit } = useLocalSearchParams<{ unit: string }>();
  const toast = useToast();

  const [installment, setInstallment] = useState<Installment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInstallment() {
      setLoading(true);
      toast.show('Loading installment...');
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('unit_id', unit)
        .in('status', ['pending', 'processing'])
        .order('due_date', { ascending: true })
        .limit(1)
        .maybeSingle();
      setLoading(false);
      if (error || !data) {
        toast.show('No pending installments');
        setInstallment(null);
        return;
      }
      setInstallment(data as Installment);
    }
    if (unit) fetchInstallment();
    // toast is stable from context, but included for completeness
  }, [unit, toast]);

  async function handlePayment() {
    if (!installment) {
      toast.show('No installment to pay');
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.show('Please login first');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit, email: user.email, installmentId: installment.id }),
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

  if (!installment) {
    return (
      <View style={styles.container}>
        <ThemedText>No pending installments</ThemedText>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <ThemedText type="title">Checkout</ThemedText>
      <ThemedText>Amount: {installment.amount}</ThemedText>
      <ThemedText>
        Due: {installment.due_date ? new Date(installment.due_date).toLocaleDateString() : ''}
      </ThemedText>
      <PrimaryButton title="Pay Now" onPress={handlePayment} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: Layout.screenPadding, gap: 12 },
});
