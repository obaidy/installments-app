import { useLocalSearchParams } from 'expo-router';
import { View, Button, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabaseClient';
import { ThemedText } from '@/components/ThemedText';

export default function CheckoutScreen() {
  const { unit } = useLocalSearchParams<{ unit: string }>();

  async function handlePayment() {
    // Placeholder payment logic.
    const { error } = await supabase
      .from('payments')
      .insert({ unit_id: Number(unit), amount: 100 });

    if (error) Alert.alert(error.message);
    else Alert.alert('Payment successful');
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
