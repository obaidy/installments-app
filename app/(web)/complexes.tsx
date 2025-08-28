import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View, Alert } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { supabase } from '../../lib/supabaseClient';
import useAuthorization from '../../hooks/useAuthorization';
import AdminLayout from './AdminLayout';
import { StyledInput } from '../../components/form/StyledInput';
import { AdminActionButton } from '../../components/admin/AdminActionButton';
import { AdminListItem } from '../../components/admin/AdminListItem';
import { AdminToolbar } from '../../components/admin/AdminToolbar';
import { AdminEmpty } from '../../components/admin/AdminEmpty';
import { AdminLoading } from '../../components/admin/AdminLoading';
import { AdminModal } from '../../components/admin/AdminModal';


type Complex = { id: number; name: string };

export default function ComplexesScreen() {
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [editing, setEditing] = useState<Record<number, string>>({});
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const { authorized, loading } = useAuthorization('admin');

  useEffect(() => {
    if (authorized) {
      fetchComplexes();
    
    }
  }, [authorized]);

  async function fetchComplexes() {
    let q = supabase
      .from('complexes')
      .select('id, name', { count: 'exact' })
      .order('name')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (query) q = q.ilike('name', `%${query}%`);
    const { data } = await q;
    if (data) setComplexes(data as Complex[]);
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

  async function addComplex() {
    if (!newName) {
      Alert.alert('Missing name', 'Please enter a complex name.');
      return;
    }
    // Auto-generate a unique code from the name if not provided
    let code = newCode?.trim();
    if (!code) {
      const base = newName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 24);
      code = base || `complex-${Math.random().toString(36).slice(2, 6)}`;

      // Ensure uniqueness by adding numeric suffix if needed
      let attempt = 1;
      // Fetch existing codes that start with base
      const { data: existing } = await supabase
        .from('complexes')
        .select('code')
        .ilike('code', `${base}%`);
      const existingSet = new Set((existing || []).map((e: any) => String(e.code).toLowerCase()));
      while (existingSet.has(code.toLowerCase())) {
        attempt += 1;
        code = `${base}-${attempt}`.slice(0, 28);
      }
    }
    await supabase
      .from('complexes')
      .insert({ name: newName, code });
    setNewName('');
    setNewCode('');
    fetchComplexes();
  }


  if (!authorized && !loading) {
    return (
      <AdminLayout title="Complexes">
        <AdminEmpty title="Access denied" />
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="Complexes">
        <AdminLoading />
      </AdminLayout>
    );
  }


  return (
    <AdminLayout title="Complexes">
      <AdminToolbar
        query={query}
        setQuery={setQuery}
        onSearch={() => { setPage(0); fetchComplexes(); }}
        onPrev={() => { if (page > 0) { setPage(p => p - 1); fetchComplexes(); } }}
        onNext={() => { setPage(p => p + 1); fetchComplexes(); }}
        right={<AdminActionButton title="Add Complex" onPress={() => setModalVisible(true)} />}
      />
      <FlatList
        data={complexes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <AdminListItem>
            <ThemedText style={styles.name}>{item.name}</ThemedText>
            <StyledInput
              variant="filled"
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
                onPress={() => updateComplex(item.id)}
              />
              <AdminActionButton
                title="Delete"
                variant="danger"
                onPress={() => deleteComplex(item.id)}
              />
            </View>
          </AdminListItem>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    <AdminModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="New Complex"
      >
        <StyledInput
          variant="filled"
          style={styles.input}
          placeholder="Name"
          value={newName}
          onChangeText={setNewName}
        />
        <StyledInput
          variant="filled"
          style={styles.input}
          placeholder="Code (optional)"
          value={newCode}
          onChangeText={setNewCode}
        />
        <AdminActionButton
          title="Add"
          onPress={() => {
            addComplex();
            setModalVisible(false);
          }}
        />
      </AdminModal>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  name: { flex: 1 },
  input: { paddingHorizontal: 8, borderRadius: 8, flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  separator: { height: 12 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
});
