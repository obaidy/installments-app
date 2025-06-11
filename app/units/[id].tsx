import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
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
      .select('*, complex:complexes(name)')
      .eq('id', unitId)
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
    return (
      <View style={styles.item}>
        <ThemedText>
          Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : ''}
        </ThemedText>
        <ThemedText>Amount: {item.amount_iqd}</ThemedText>
        <ThemedText>Paid: {item.paid ? 'Yes' : 'No'}</ThemedText>
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
  item: { padding: 12, backgroundColor: '#fff', borderRadius: 4 },
  separator: { height: 10 },
});