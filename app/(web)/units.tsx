import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { supabase } from '../../lib/supabaseClient';
import useAuthorization from '../../hooks/useAuthorization';
import AdminLayout from './AdminLayout';
import { StyledInput } from '../../components/form/StyledInput';
import { AdminActionButton } from '../../components/admin/AdminActionButton';
import { AdminListItem } from '../../components/admin/AdminListItem';

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
      <AdminLayout title="Units">
        <ThemedText>Access denied</ThemedText>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="Units">
        <ThemedText>Loading...</ThemedText>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Units">
      <FlatList
        data={units}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <AdminListItem>
            <ThemedText style={styles.name}>{item.name}</ThemedText>
            <StyledInput
              style={styles.input}
              value={editing[item.id] ?? ''}
              placeholder="New name"
              onChangeText={(text) =>
                setEditing((e) => ({ ...e, [item.id]: text }))
              }
            />
            <View style={styles.actions}>
              <AdminActionButton
                title="Update"
                onPress={() => updateUnit(item.id)}
              />
              <AdminActionButton
                title="Delete"
                variant="danger"
                onPress={() => deleteUnit(item.id)}
              />
            </View>
          </AdminListItem>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  name: { flex: 1 },
  input: { height: 40, borderWidth: 1, paddingHorizontal: 8, borderRadius: 4, flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  separator: { height: 12 },
});