import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { supabase } from '../../lib/supabaseClient';
import { PrimaryButton } from '../../components/form/PrimaryButton';

export default function UnitDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [installments, setInstallments] = useState<any[]>([]);
  const [unit, setUnit] = useState<any | null>(null);

  useEffect(() => {
    if (id) {
      fetchUnit(id);
      fetchInstallments(id);
    }
  }, [id]);

  async function fetchUnit(unitId: string) {
    const { data } = await supabase
      .from('units')
      .select('*, complex:complexes(name), client_complex_status!inner(status)')
      .eq('id', unitId)
      .eq('client_complex_status.status', 'approved')
      .single();
    if (data) setUnit(data);
  }

  async function fetchInstallments(unitId: string) {
    const { data } = await supabase
      .from('installments')
      .select('*')
      .eq('unit_id', unitId)
      .order('due_date', { ascending: true });
    if (data) setInstallments(data);
  }

  function renderItem({ item }: { item: any }) {
    const paid = !!item.paid;
    return (
      <View style={styles.timelineItem}>
        <View style={styles.timelineDot} />
        <View style={styles.timelineCard}>
          <ThemedText style={{ fontWeight: '600' }}>
            {item.type === 'service_fee' ? 'Service Fee' : 'Installment'} #{item.id}
          </ThemedText>
          <ThemedText>{new Date(item.due_date).toLocaleDateString()}</ThemedText>
          <ThemedText>{item.amount_iqd} IQD • {paid ? 'PAID' : 'DUE'}</ThemedText>
        </View>
      </View>
    );
  }

  if (!unit) {
    return (
      <View style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">
        {unit.unit_number} - {unit.complex?.name}
      </ThemedText>
      <FlatList
        data={installments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <PrimaryButton
        title="Setup Auto Pay"
        onPress={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  timelineItem: { position: 'relative', paddingLeft: 16 },
  timelineDot: { position: 'absolute', left: 2, top: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#635BFF' },
  timelineCard: { padding: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  separator: { height: 12 },
});
