import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabaseClient';
import { ThemedText } from '../../components/ThemedText';

type Payment = {
  id: number;
  amount: number;
  status: string;
  paid_at: string | null;
  due_date: string | null;
  type: 'installment' | 'service_fee';
};

export default function PaymentHistoryScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: units } = await supabase
      .from('units')
      .select('id, complex_id, client_complex_status!inner(status)')
      .eq('user_id', user.id)
      .eq('client_complex_status.status', 'approved');

    const unitIds = units?.map((u) => u.id) || [];
    if (unitIds.length === 0) return;

    const { data, error } = await supabase
      .from('payments')
      .select('id, amount, status, paid_at, installment_id, service_fee_id, installments(due_date), service_fees(due_date)')
      .in('unit_id', unitIds)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false });

    if (!error && data) {
      const mapped = (data as any[]).map((p): Payment => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        paid_at: p.paid_at,
        due_date: p.installments?.due_date || p.service_fees?.due_date || null,
        type: p.service_fee_id ? 'service_fee' : 'installment',
      }));

      setPayments(mapped);

    }
  }

  function renderItem({ item }: { item: Payment }) {
    return (
      <View style={styles.item}>
        <ThemedText>Amount: {item.amount}</ThemedText>
        <ThemedText>
          Type: {item.type === 'service_fee' ? 'Service Fee' : 'Installment'}
        </ThemedText>
        <ThemedText>
        Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : ''}
        </ThemedText>
        <ThemedText>
          Paid:{' '}
          {item.paid_at ? new Date(item.paid_at).toLocaleDateString() : ''}
        </ThemedText>
        <ThemedText>Status: {item.status}</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Payment History</ThemedText>
      <FlatList
        data={payments}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  item: { padding: 12, backgroundColor: '#fff', borderRadius: 4 },
  separator: { height: 10 },
});
