import { useSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { supabase } from '../../lib/supabaseClient';
import { PrimaryButton } from '../../components/form/PrimaryButton';

type Unit = { id: number; name: string };

export default function ManagerUnits() {
  const params = useSearchParams();
  const complexId = Number(params.get('complexId'));
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    (async () => {
      if (!complexId) return;
      const { data } = await supabase
        .from('units')
        .select('id, name')
        .eq('complex_id', complexId)
        .order('name');
      setUnits((data as any[])?.map(u => ({ id: u.id, name: u.name })) || []);
    })();
  }, [complexId]);

  return (
    <View style={styles.container}>
      <ThemedText type="title">Units</ThemedText>
      <FlatList
        data={units}
        keyExtractor={(u) => String(u.id)}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item}>
            <ThemedText>{item.name}</ThemedText>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  item: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
});

