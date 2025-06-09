import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { supabase } from '../../lib/supabaseClient';
import useAuthorization from '../../hooks/useAuthorization';
import { StyledInput } from '../../components/form/StyledInput';
import { PrimaryButton } from '../../components/form/PrimaryButton';

type Unit = { id: number; name: string; complex_id: number };

export default function UnitsAdminScreen() {
  const { authorized, loading } = useAuthorization('admin');
  const [units, setUnits] = useState<Unit[]>([]);
  const [editing, setEditing] = useState<Record<number, string>>({});

  useEffect(() => {
    if (authorized) fetchUnits();
  }, [authorized]);

  async function fetchUnits() {
    const { data } = await supabase.from('units').select('*');
    if (data) setUnits(data as Unit[]);
  }

  async function updateUnit(id: number) {
    const name = editing[id];
    if (!name) return;
    await supabase.from('units').update({ name }).eq('id', id);
    setEditing((e) => ({ ...e, [id]: '' }));
    fetchUnits();
  }

  async function deleteUnit(id: number) {
    await supabase.from('units').delete().eq('id', id);
    fetchUnits();
  }

  if (!authorized && !loading) {
    return (
      <View style={styles.container}>
        <ThemedText>Access denied</ThemedText>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Units</ThemedText>
      <FlatList
        data={units}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <ThemedText>{item.name}</ThemedText>
            <StyledInput
              style={styles.input}
              value={editing[item.id] ?? ''}
              placeholder="New name"
              onChangeText={(text) =>
                setEditing((e) => ({ ...e, [item.id]: text }))
              }
            />
            <PrimaryButton
              title="Update"
              onPress={() => updateUnit(item.id)}
            />
            <PrimaryButton
              title="Delete"
              onPress={() => deleteUnit(item.id)}
              style={styles.delete}
            />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  item: { padding: 12, backgroundColor: '#fff', borderRadius: 4, gap: 8 },
  input: { height: 40, borderWidth: 1, paddingHorizontal: 8, borderRadius: 4 },
  delete: { backgroundColor: 'red' },
  separator: { height: 10 },
});