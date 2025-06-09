import { useLocalSearchParams } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { PrimaryButton } from '../../components/form/PrimaryButton';
import { useToast } from '../../components/Toast';
import { Layout } from '../../constants/Layout';
import { supabase } from '../../lib/supabaseClient';
import {
  createOrRetrieveCustomer,
  storeCard,
  chargeCustomer,
} from '../../lib/stripeClient';
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
      const customer = await createOrRetrieveCustomer(user.email!);
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

      toast.show('Payment successful: ' + intent.status);
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
