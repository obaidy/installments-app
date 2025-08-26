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

type UserRole = { user_id: string; role: string };

export default function UsersAdminScreen() {
 const { authorized, loading } = useAuthorization(['admin']);
  const [users, setUsers] = useState<UserRole[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (authorized) fetchUsers();
  }, [authorized]);

  async function fetchUsers() {
    const { data } = await supabase.from('user_roles').select('user_id, role');
    if (data) setUsers(data as UserRole[]);
  }

  async function updateRole(id: string) {
    const role = editing[id];
    if (!role) return;
    await supabase.from('user_roles').update({ role }).eq('user_id', id);
    setEditing((e) => ({ ...e, [id]: '' }));
    fetchUsers();
  }

  async function deleteRole(id: string) {
    await supabase.from('user_roles').delete().eq('user_id', id);
    fetchUsers();
  }

  if (!authorized && !loading) {
    return (
      <AdminLayout title="Users">
        <ThemedText>Access denied</ThemedText>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="Users">
        <ThemedText>Loading...</ThemedText>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Users">
      <FlatList
        data={users}
        keyExtractor={(item) => item.user_id}
        renderItem={({ item }) => (
          <AdminListItem>
            <ThemedText style={styles.userId}>{item.user_id}</ThemedText>
            <StyledInput
              style={styles.input}
              value={editing[item.user_id] ?? ''}
              placeholder={item.role}
              onChangeText={(text) =>
                setEditing((e) => ({ ...e, [item.user_id]: text }))
              }
            />
            <View style={styles.actions}>
              <AdminActionButton
                title="Update"
                onPress={() => updateRole(item.user_id)}
              />
              <AdminActionButton
                title="Delete"
                variant="danger"
                onPress={() => setConfirmId(item.user_id)}
              />
            </View>
          </AdminListItem>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    <AdminModal
        visible={confirmId !== null}
        onClose={() => setConfirmId(null)}
        title="Confirm Delete"
      >
        <ThemedText>Are you sure you want to delete this user role?</ThemedText>
        <View style={styles.modalActions}>
          <AdminActionButton
            title="Cancel"
            onPress={() => setConfirmId(null)}
          />
          <AdminActionButton
            title="Delete"
            variant="danger"
            onPress={() => {
              if (confirmId) deleteRole(confirmId);
              setConfirmId(null);
            }}
          />
        </View>
      </AdminModal>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  userId: { flex: 1 },
  input: { height: 40, borderWidth: 1, paddingHorizontal: 8, borderRadius: 4, flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  separator: { height: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});