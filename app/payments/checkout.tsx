import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { PrimaryButton } from '../../components/form/PrimaryButton';
import { useToast } from '../../components/Toast';
import { Layout } from '../../constants/Layout';
import { supabase } from '../../lib/supabaseClient';
import { ThemedText } from '../../components/ThemedText';
import { createCheckout, getPaymentStatus } from '../../lib/api/payments';

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
  const [paying, setPaying] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

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
    setPaying(true);
    try {
      const metadata: Record<string, string> = { unit_id: String(due.unit_id || '') };
      if (type === 'service_fee') metadata.service_fee_id = String(due.id);
      else metadata.installment_id = String(due.id);

      const result = await createCheckout(
        due.amount_iqd,
        type,
        metadata,
        { type: (type === 'service_fee' ? 'service_fee' : 'installment'), id: Number(due.id) }
      );

      if (result.redirectUrl) {
        toast.show('Opening payment…');
        // WebBrowser opens in createCheckout for Qi; nothing else to do now
        return;
      }

      const ref = result.referenceId;
      if (ref) {
        toast.show('Processing payment…');
        // Poll status briefly for Stripe intents
        let attempts = 0;
        const poll = async () => {
          attempts++;
          try {
            const status = await getPaymentStatus(ref);
            if (status === 'paid') {
              toast.show('Payment successful');
              setDue((d) => (d ? { ...d, paid: true } : d));
              if (pollRef.current) clearInterval(pollRef.current);
            } else if (attempts >= 15) {
              if (pollRef.current) clearInterval(pollRef.current);
              toast.show('Payment created. Check status later.');
            }
          } catch (e: any) {
            if (pollRef.current) clearInterval(pollRef.current);
            toast.show(e?.message || 'Error checking status');
          }
        };
        pollRef.current = setInterval(poll, 2000);
      } else {
        toast.show('Checkout created');
      }
    } catch (err: any) {
      toast.show((await import('../../lib/apiError')).formatApiError((err as any)?.error || err?.message));
    } finally {
      setPaying(false);
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
      <PrimaryButton title={paying ? 'Processing…' : 'Pay Now'} onPress={handlePayment} disabled={paying} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: Layout.screenPadding, gap: 12 },
});


