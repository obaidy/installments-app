import { useLocalSearchParams } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { PrimaryButton } from '../../components/form/PrimaryButton';
import { useToast } from '../../components/Toast';
import { Layout } from '../../constants/Layout';
import { supabase } from '../../lib/supabaseClient';
const API_URL = process.env.EXPO_PUBLIC_API_URL;
import { ThemedText } from '@/components/ThemedText';

export default function CheckoutScreen() {
  const { unit } = useLocalSearchParams<{ unit: string }>();
  const toast = useToast();

  async function handlePayment() {
    // Retrieve current user
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
        body: JSON.stringify({ unit, email: user.email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Payment failed');


      await supabase.from('payments').insert({
        unit_id: Number(unit),
        amount: 100,
        status: 'paid',
        paid_at: new Date().toISOString(),
      });

      toast.show('Payment successful: ' + result.status);
    } catch (err: any) {
      toast.show(err.message);
    }
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Checkout</ThemedText>
      <PrimaryButton title="Pay Now" onPress={handlePayment} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: Layout.screenPadding },
});
