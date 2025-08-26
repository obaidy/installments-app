import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { supabase, grantComplexRole, revokeComplexRole } from '../../lib/supabaseClient';
import useAuthorization from '../../hooks/useAuthorization';
import AdminLayout from './AdminLayout';
import { StyledInput } from '../../components/form/StyledInput';
import { AdminActionButton } from '../../components/admin/AdminActionButton';
import { AdminListItem } from '../../components/admin/AdminListItem';
import { AdminModal } from '../../components/admin/AdminModal';


type ComplexRole = { user_id: string; role: string };
type Complex = { id: number; name: string; complex_roles?: ComplexRole[] };

export default function ComplexesScreen() {
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [editing, setEditing] = useState<Record<number, string>>({});
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [roleInputs, setRoleInputs] = useState<Record<number, { userId: string; role: string }>>({});
  const { authorized, loading } = useAuthorization(['admin']);

  useEffect(() => {
    if (authorized) {
      fetchComplexes();
    
    }
  }, [authorized]);

  async function fetchComplexes() {
    const { data } = await supabase
      .from('complexes')
      .select('id, name, complex_roles(user_id, role)');
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

  async function grantRole(id: number) {
    const input = roleInputs[id];
    if (!input?.userId || !input?.role) return;
    await grantComplexRole(input.userId, id, input.role);
    setRoleInputs((r) => ({ ...r, [id]: { userId: '', role: '' } }));
    fetchComplexes();
  }

  async function revokeRole(id: number) {
    const input = roleInputs[id];
    if (!input?.userId) return;
    await revokeComplexRole(input.userId, id);
    setRoleInputs((r) => ({ ...r, [id]: { userId: '', role: '' } }));
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
            <View style={styles.rolesSection}>
              {item.complex_roles?.map((r) => (
                <ThemedText key={r.user_id}>
                  {r.user_id}: {r.role}
                </ThemedText>
              ))}
              <StyledInput
                style={styles.input}
                placeholder="User ID"
                value={roleInputs[item.id]?.userId ?? ''}
                onChangeText={(text) =>
                  setRoleInputs((s) => ({
                    ...s,
                    [item.id]: { ...(s[item.id] ?? { role: '' }), userId: text },
                  }))
                }
              />
              <StyledInput
                style={styles.input}
                placeholder="Role"
                value={roleInputs[item.id]?.role ?? ''}
                onChangeText={(text) =>
                  setRoleInputs((s) => ({
                    ...s,
                    [item.id]: { ...(s[item.id] ?? { userId: '' }), role: text },
                  }))
                }
              />
              <View style={styles.actions}>
                <AdminActionButton
                  title="Grant"
                  onPress={() => grantRole(item.id)}
                />
                <AdminActionButton
                  title="Revoke"
                  variant="danger"
                  onPress={() => revokeRole(item.id)}
                />
              </View>
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
  rolesSection: { marginTop: 8, gap: 4 },
});