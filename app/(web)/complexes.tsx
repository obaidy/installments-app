import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { supabase } from '../../lib/supabaseClient';
import useAuthorization from '../../hooks/useAuthorization';
import AdminLayout from './AdminLayout';
import { StyledInput } from '../../components/form/StyledInput';
import { AdminActionButton } from '../../components/admin/AdminActionButton';
import { AdminListItem } from '../../components/admin/AdminListItem';
import { AdminModal } from '../../components/admin/AdminModal';


type Complex = { id: number; name: string };

export default function ComplexesScreen() {
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [editing, setEditing] = useState<Record<number, string>>({});
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const { authorized, loading } = useAuthorization('admin');

  useEffect(() => {
    if (authorized) {
      fetchComplexes();
    
    }
  }, [authorized]);

  async function fetchComplexes() {
    const { data } = await supabase.from('complexes').select('id, name');
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
    if (!newName) return;
    await supabase
      .from('complexes')
      .insert(newCode ? { name: newName, code: newCode } : { name: newName });
    setNewName('');
    setNewCode('');
    fetchComplexes();
  }


  if (!authorized && !loading) {
    return (
      <AdminLayout title="Complexes">
        <ThemedText>Access denied</ThemedText>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="Complexes">
        <ThemedText>Loading...</ThemedText>
      </AdminLayout>
    );
  }


  return (
    <AdminLayout title="Complexes">
      <AdminActionButton title="Add Complex" onPress={() => setModalVisible(true)} />
      <FlatList
        data={complexes}
        keyExtractor={(item) => item.id.toString()}
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
          style={styles.input}
          placeholder="Name"
          value={newName}
          onChangeText={setNewName}
        />
        <StyledInput
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
  input: { height: 40, borderWidth: 1, paddingHorizontal: 8, borderRadius: 4, flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  separator: { height: 12 },
});