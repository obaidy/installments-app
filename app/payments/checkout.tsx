import { useLocalSearchParams } from 'expo-router';
import { View, Button, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabaseClient';
import {
  createOrRetrieveCustomer,
  storeCard,
  chargeCustomer,
} from '../../lib/stripeClient';
import { ThemedText } from '@/components/ThemedText';

export default function CheckoutScreen() {
  const { unit } = useLocalSearchParams<{ unit: string }>();

  async function handlePayment() {
    // Example Stripe integration.
    // Retrieve current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Please login first');
      return;
    }

    try {
      // Create or load a Stripe customer based on email
      const customer = await createOrRetrieveCustomer(user.email!);

      // In real app, collect card details from user. Here we use a test token
      const paymentMethod = 'pm_card_visa';
      await storeCard(customer.id, paymentMethod);

      const intent = await chargeCustomer(customer.id, 10000, {
        unit_id: unit,
      });

      await supabase.from('payments').insert({
        unit_id: Number(unit),
        amount: 100,
        status: 'paid',
        paid_at: new Date().toISOString(),
      });

      Alert.alert('Payment successful: ' + intent.status);
    } catch (err: any) {
      Alert.alert(err.message);
    }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Checkout</ThemedText>
      <Button title="Pay Now" onPress={handlePayment} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
});
