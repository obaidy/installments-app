import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabaseClient';
import { ThemedText } from '../../components/ThemedText';
import { useRouter } from 'expo-router';
import InstallmentCard, { type Installment as InstallmentItem } from '../../components/InstallmentCard';

type DueItem = InstallmentItem;

export default function UpcomingInstallmentsScreen() {
  const [dues, setDues] = useState<DueItem[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDues();
  }, []);

  async function fetchDues() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch approved unit ids for this user
    const { data: units } = await supabase
      .from('units')
      .select('id, complex_id, client_complex_status!inner(status)')
      .eq('user_id', user.id)
      .eq('client_complex_status.status', 'approved');
    const unitIds = (units as any[])?.map((u: any) => u.id) || [];
    if (unitIds.length === 0) return setDues([]);

    // Fetch both installments and service fees, then merge and sort
    const [inst, fees] = await Promise.all([
      supabase
        .from('installments')
        .select('id, unit_id, amount_iqd, due_date, paid')
        .in('unit_id', unitIds)
        .eq('paid', false),
      supabase
        .from('service_fees')
        .select('id, unit_id, amount_iqd, due_date, paid')
        .in('unit_id', unitIds)
        .eq('paid', false),
    ]);

    const mapped: DueItem[] = [
      ...(((inst.data as any[]) || []).map((i) => ({ ...i, type: 'installment' as const }))),
      ...(((fees.data as any[]) || []).map((f) => ({ ...f, type: 'service_fee' as const }))),
    ]
      .filter((d) => !!d.due_date)
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

    setDues(mapped);
    setLoading(false);
  }

  function renderItem({ item }: { item: DueItem }) {
    return (
      <InstallmentCard
        item={{
          id: item.id,
          unit_id: item.unit_id,
          amount_iqd: item.amount_iqd,
          due_date: item.due_date || new Date().toISOString(),
          type: item.type,
          paid: item.paid,
        }}
        onPay={(i) => router.push(`/payments/checkout?id=${i.id}&type=${i.type}` as any)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Upcoming Dues</ThemedText>
      {loading ? (
        <View style={{ gap: 10 }}>
          <ThemedText>Loading…</ThemedText>
        </View>
      ) : (
      <FlatList
        data={dues}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  separator: { height: 10 },
});
