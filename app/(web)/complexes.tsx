import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { supabase } from '../../lib/supabaseClient';
import useAuthorization from '../../hooks/useAuthorization';
import { StyledInput } from '../../components/form/StyledInput';
import { PrimaryButton } from '../../components/form/PrimaryButton';


type Complex = { id: number; name: string };

export default function ComplexesScreen() {
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [editing, setEditing] = useState<Record<number, string>>({});
  const { authorized, loading } = useAuthorization('admin');

  useEffect(() => {
    if (authorized) {
      fetchComplexes();
    
    }
  }, [authorized]);

  async function fetchComplexes() {
    const { data } = await supabase.from('complexes').select('*');
    if (data) setComplexes(data);
  }

  async function updateComplex(id: number) {
    const name = editing[id];
    if (!name) return;
    await supabase.from('complexes').update({ name }).eq('id', id);
    setEditing((e) => ({ ...e, [id]: '' }));
    fetchComplexes();
  }

  async function deleteComplex(id: number) {
    await supabase.from('complexes').delete().eq('id', id);
    fetchComplexes();
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
      <ThemedText type="title">Complexes</ThemedText>
      <FlatList
        data={complexes}
        keyExtractor={(item) => item.id.toString()}
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
              onPress={() => updateComplex(item.id)}
            />
            <PrimaryButton
              title="Delete"
              onPress={() => deleteComplex(item.id)}
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