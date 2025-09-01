import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import InstallmentCard, { type Installment } from '../../../components/InstallmentCard';
import { supabase } from '../../../lib/supabaseClient';

export default function UnitDetails() {
const { id } = useLocalSearchParams<{ id: string }>();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchInstallments(id);
  }, [id]);

  async function fetchInstallments(unitId: string) {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('installments')
        .select('id, unit_id, amount_iqd, due_date, paid, paid_at')
        .eq('unit_id', unitId)
        .order('due_date', { ascending: true });
      if (error) throw error;
      const mapped: Installment[] =
        data?.map((i) => ({
          id: i.id,
          unit_id: i.unit_id,
          amount_iqd: i.amount_iqd,
          due_date: i.due_date,
          type: 'installment',
          paid: i.paid,
          paid_at: i.paid_at,
        })) ?? [];
      setInstallments(mapped);
    } catch (e: any) {
      setError(e.message);
      setInstallments([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#991B1B' }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 16 }}>Unit {id}</Text>
      {installments.map((inst) => (
        <View key={inst.id} style={{ marginBottom: 12 }}>
          <InstallmentCard item={inst} />
        </View>
      ))}
    </View>
  );
}