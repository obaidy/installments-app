import { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, RefreshControl, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabaseClient';
import { ThemedText } from '../../components/ThemedText';
import { useTranslation } from 'react-i18next';
import { formatIQD } from '../../lib/format';
import ClientHeader from '../../components/ClientHeader';
import Ionicons from '@expo/vector-icons/Ionicons';

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
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(true);
  const [filter, setFilter] = useState<'all'|'installment'|'service_fee'>('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = useCallback(async () => {
    setRefreshing(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: units } = await supabase
      .from('units')
      .select('id, complex_id, client_complex_status!inner(status)')
      .eq('user_id', user.id)
      ;

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
    setRefreshing(false);
  }, []);

  function renderItem({ item }: { item: Payment }) {
    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <ThemedText style={styles.amount}>{formatIQD(item.amount)}</ThemedText>
          <ThemedText style={styles.subtle}>{item.paid_at ? new Date(item.paid_at).toLocaleDateString() : ''}</ThemedText>
        </View>
        <ThemedText style={styles.subtle}>{item.type === 'service_fee' ? t('typeServiceFee') : t('typeInstallment')}</ThemedText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ClientHeader title={t('paymentHistory')} />
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <FilterPill icon="albums-outline" label={t('seeAll')} active={filter==='all'} onPress={() => setFilter('all')} />
          <FilterPill icon="calendar-outline" label={t('typeInstallment')} active={filter==='installment'} onPress={() => setFilter('installment')} />
          <FilterPill icon="construct-outline" label={t('typeServiceFee')} active={filter==='service_fee'} onPress={() => setFilter('service_fee')} />
        </View>
      </View>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchPayments} />}
        data={payments.filter(p => filter === 'all' ? true : p.type === filter)}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={<ThemedText>{refreshing ? t('loading') : t('noPayments')}</ThemedText>}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

function FilterPill({ label, icon, active, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; active?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: active ? '#111827' : '#F3F4F6' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} size={16} color={active ? 'white' : '#111827'} />
        <ThemedText style={{ color: active ? 'white' : '#111827', fontWeight: '600' }}>{label}</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { padding: 16, backgroundColor: '#fff', borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontWeight: '700', fontSize: 16 },
  subtle: { color: '#6B7280' },
  separator: { height: 10 },
});
