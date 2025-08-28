import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabaseClient';
import { ThemedText } from '../../components/ThemedText';
import { useRouter } from 'expo-router';

type DueItem = {
  id: number;
  unit_id: number;
  amount_iqd: number;
  due_date: string | null;
  paid: boolean;
  type: 'installment' | 'service_fee';
};

export default function UpcomingInstallmentsScreen() {
  const [dues, setDues] = useState<DueItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchDues();
  }, []);

  async function fetchDues() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Fallback to base tables with client_complex_status filter
    const { data, error } = await supabase
      .from('installments')
      .select('id, unit_id, amount_iqd, due_date, paid')
      .in('unit_id', (
        await supabase
          .from('units')
          .select('id, complex_id, client_complex_status!inner(status)')
          .eq('user_id', user.id)
          .eq('client_complex_status.status', 'approved')
      ).data?.map((u: any) => u.id) || [])
      .order('due_date', { ascending: true });

   if (!error && data) setDues(data as DueItem[]);
  }

  function renderItem({ item }: { item: DueItem }) {
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() =>
          router.push(
            `/payments/checkout?id=${item.id}&type=${item.type}` as any,
          )
        }
      >
        <ThemedText>
          {item.type === 'service_fee' ? 'Service Fee' : 'Installment'}
        </ThemedText>
        <ThemedText>Amount: {item.amount_iqd}</ThemedText>
        <ThemedText>
          Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : ''}
        </ThemedText>
        <ThemedText>Paid: {item.paid ? 'Yes' : 'No'}</ThemedText>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Upcoming Dues</ThemedText>
      <FlatList
        data={dues}
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
