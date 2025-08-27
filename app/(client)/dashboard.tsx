import { View, Text, FlatList, SafeAreaView } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import MoneySummary, { type MoneyBuckets } from '../../components/MoneySummary';
import InstallmentCard, { type Installment } from '../../components/InstallmentCard';
import { createCheckout } from '../../lib/api/payments';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'expo-router';

export default function Dashboard() {
  const router = useRouter();

  const [items, setItems] = useState<Installment[]>([]);
  const [buckets, setBuckets] = useState<MoneyBuckets>({
    today: 0,
    next30: 0,
    pastDue: 0,
  });

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('v_user_dues')
        .select('id, unit_id, amount_iqd, due_date, paid, paid_at, type')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true })
        .limit(50);

      if (error) {
        console.warn('dues fetch error:', error.message);
        return;
      }

      const list = (data || []) as Installment[];
      setItems(list);

      const today = new Date();
      const todayStr = today.toDateString();
      const in30 = new Date();
      in30.setDate(in30.getDate() + 30);

      let pastDue = 0;
      let next30 = 0;
      let todayDue = 0;

      for (const i of list) {
        if (i.paid || i.paid_at) continue;
        const d = new Date(i.due_date);
        if (d.toDateString() === todayStr) todayDue += i.amount_iqd;
        else if (d > today && d <= in30) next30 += i.amount_iqd;
        else if (d < today) pastDue += i.amount_iqd;
      }

      setBuckets({ today: todayDue, next30, pastDue });
    })();
  }, []);

  const handlePay = useCallback(
    async (i: Installment) => {
      const metadata: Record<string, string> = {
        unit_id: String(i.unit_id),
      };
      if (i.type === 'service_fee') metadata.service_fee_id = String(i.id);
      else metadata.installment_id = String(i.id);

      const { referenceId } = await createCheckout(
        i.amount_iqd,
        i.type === 'service_fee' ? `Service Fee ${i.id}` : `Installment ${i.id}`,
        metadata,
      );

    if (referenceId) {
        router.push(`/(client)/payments/${encodeURIComponent(referenceId)}`);
      }
    },
    [router],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <View style={{ padding: 16, gap: 16 }}>
        <MoneySummary buckets={buckets} />
        <Text style={{ fontSize: 18, fontWeight: '700' }}>Upcoming & Due</Text>
        <FlatList
          data={items}
          keyExtractor={(item, index) => String(item.id ?? index)}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <InstallmentCard item={item} onPay={handlePay} />
          )}
        />
      </View>
    </SafeAreaView>
  );
}
