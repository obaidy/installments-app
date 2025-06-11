import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { ThemedText } from '@/components/ThemedText';
import { supabase } from '../../lib/supabaseClient';

interface UnitWithDue {
  id: number;
  name: string;
  total_due: number;
}

export default function HomeDashboard() {
  const [units, setUnits] = useState<UnitWithDue[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchUnits();
  }, []);

  async function fetchUnits() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: unitRows } = await supabase
      .from('units')
      .select('id, name')
      .eq('user_id', user.id);
    if (!unitRows) return;

    const list: UnitWithDue[] = [];
    for (const u of unitRows as any[]) {
      const { data: dueRows } = await supabase
        .from('installments')
        .select('amount_iqd')
        .eq('unit_id', u.id)
        .eq('paid', false);
      const total = dueRows?.reduce((s, r) => s + (r.amount_iqd as number), 0) || 0;
      list.push({ id: u.id, name: u.name, total_due: total });
    }
    setUnits(list);
  }

  const totalDue = units.reduce((sum, u) => sum + (u.total_due || 0), 0);

  return (
    <View style={styles.container}>
    <ThemedText type="title">My Units</ThemedText>
    <ThemedText>Total Due Now: {totalDue}</ThemedText>
    <FlatList
      data={units}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.item}
          onPress={() => router.push(`/units/${item.id}`)}
        >
          <ThemedText>{item.name}</ThemedText>
          <ThemedText>Due: {item.total_due}</ThemedText>
        </TouchableOpacity>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
    <PrimaryButton
      title="Add Another Unit"
      onPress={() => router.push('/complexes/add')}
    />
  </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  item: { padding: 12, backgroundColor: '#fff', borderRadius: 4 },
  separator: { height: 10 },
});
