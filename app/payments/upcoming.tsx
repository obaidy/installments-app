import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabaseClient';
import { ThemedText } from '@/components/ThemedText';

type Payment = {
  id: number;
  amount: number;
  status: string;
  due_date: string | null;
};

export default function UpcomingInstallmentsScreen() {
  const [installments, setInstallments] = useState<Payment[]>([]);

  useEffect(() => {
    fetchInstallments();
  }, []);

  async function fetchInstallments() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: units } = await supabase
      .from('units')
      .select('id')
      .eq('user_id', user.id);

    const unitIds = units?.map((u) => u.id) || [];
    if (unitIds.length === 0) return;

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .in('unit_id', unitIds)
      .eq('status', 'pending')
      .order('due_date', { ascending: true });

    if (!error && data) setInstallments(data as Payment[]);
  }

  function renderItem({ item }: { item: Payment }) {
    return (
      <View style={styles.item}>
        <ThemedText>Amount: {item.amount}</ThemedText>
        <ThemedText>
          Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : ''}
        </ThemedText>
        <ThemedText>Status: {item.status}</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Upcoming Installments</ThemedText>
      <FlatList
        data={installments}
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
