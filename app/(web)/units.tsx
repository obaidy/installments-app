import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { supabase } from '../../lib/supabaseClient';
import useAuthorization from '../../hooks/useAuthorization';
import { useLocalSearchParams, router } from 'expo-router';
import AdminLayout from './AdminLayout';
import { StyledInput } from '../../components/form/StyledInput';
import { AdminActionButton } from '../../components/admin/AdminActionButton';
import { AdminListItem } from '../../components/admin/AdminListItem';
import { AdminToolbar } from '../../components/admin/AdminToolbar';
import { AdminEmpty } from '../../components/admin/AdminEmpty';
import { AdminLoading } from '../../components/admin/AdminLoading';

type Unit = { id: number; name: string; complex_id: number };

type Complex = { id: number; name: string };

export default function UnitsAdminScreen() {
  const { complexId } = useLocalSearchParams<{ complexId?: string }>();
  const parsedId = complexId ? parseInt(complexId, 10) : null;
  const { authorized, loading } = useAuthorization(['manager', 'admin']);
  const [units, setUnits] = useState<Unit[]>([]);
  const [editing, setEditing] = useState<Record<number, string>>({});
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    if (!authorized) return;
    if (parsedId !== null) {
      fetchUnits(parsedId);
    } else {
      // Load complexes so an admin can choose one when none is selected
      fetchComplexes();
    }
  }, [authorized, parsedId]);

  async function fetchUnits(id: number) {
    let q = supabase
      .from('units')
      .select('*', { count: 'exact' })
      .eq('complex_id', id)
      .order('name')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (query) q = q.ilike('name', `%${query}%`);
    const { data } = await q;
    if (data) setUnits(data as Unit[]);
  }

  async function updateUnit(id: number) {
      const name = editing[id];
      if (!name || parsedId === null) return;
      await supabase.from('units').update({ name }).eq('id', id);
      setEditing((e) => ({ ...e, [id]: '' }));
      fetchUnits(parsedId);
  }

  async function deleteUnit(id: number) {
      if (parsedId === null) return;
      await supabase.from('units').delete().eq('id', id);
      fetchUnits(parsedId);
    }

  if (!authorized && !loading) {
    return (
      <AdminLayout title="Units">
        <AdminEmpty title="Access denied" />
      </AdminLayout>
    );
  }

  async function fetchComplexes() {
    const { data } = await supabase.from('complexes').select('id, name').order('name');
    if (data) setComplexes(data as Complex[]);
  }

  if (loading) {
    return (
      <AdminLayout title="Units">
        <AdminLoading />
      </AdminLayout>
    );
  }

  if (parsedId === null) {
    return (
      <AdminLayout title="Units">
        <AdminEmpty title="No complex selected" subtitle="Choose a complex to manage its units." />
        <FlatList
          data={complexes}
          keyExtractor={(c) => String(c.id)}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <AdminListItem>
              <ThemedText style={styles.name}>{item.name}</ThemedText>
              <AdminActionButton
                title="View Units"
                onPress={() => router.replace(`/(web)/units?complexId=${item.id}`)}
              />
            </AdminListItem>
          )}
        />
      </AdminLayout>
    );
  }


  return (
    <AdminLayout title="Units">
      <AdminToolbar
        query={query}
        setQuery={setQuery}
        onSearch={() => { setPage(0); if (parsedId !== null) fetchUnits(parsedId); }}
        onPrev={() => { if (page > 0 && parsedId !== null) { setPage(p => p - 1); fetchUnits(parsedId); } }}
        onNext={() => { if (parsedId !== null) { setPage(p => p + 1); fetchUnits(parsedId); } }}
      />
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
