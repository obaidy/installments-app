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
  const { authorized, loading } = useAuthorization('admin');
  const [users, setUsers] = useState<UserRole[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (authorized) fetchUsers();
  }, [authorized]);

  async function fetchUsers() {
    let q = supabase
      .from('user_roles')
      .select('user_id, role', { count: 'exact' })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (query) {
      // Filter by role only; user_id is UUID and not ilike-friendly
      q = q.ilike('role', `%${query}%`);
    }
    const { data } = await q;
    if (data) setUsers(data as UserRole[]);
  }

  async function updateRole(id: string) {
    const role = editing[id];
    if (!role) return;
    await supabase.from('user_roles').update({ role }).eq('user_id', id);
    setEditing((e) => ({ ...e, [id]: '' }));
    fetchUsers();
    setBanner('Role updated. On next sign-in, the user will be redirected via /dashboard according to their role.');
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
      {banner && (
        <AdminListItem>
          <ThemedText>{banner}</ThemedText>
          <ThemedText>
            Tip: Share /dashboard with users — it routes to Admin, Manager, or Client dashboards automatically.
          </ThemedText>
          <View style={{ alignSelf: 'flex-end' }}>
            <AdminActionButton title="Dismiss" onPress={() => setBanner(null)} />
          </View>
        </AdminListItem>
      )}
      <View style={styles.toolbar}>
        <StyledInput
          placeholder="Search by role…"
          value={query}
          onChangeText={setQuery}
          style={{ flex: 1 }}
          variant="filled"
        />
        <AdminActionButton title="Search" onPress={() => { setPage(0); fetchUsers(); }} />
        <AdminActionButton
          title="Prev"
          onPress={() => { if (page > 0) { setPage(p => p - 1); fetchUsers(); } }}
        />
        <AdminActionButton
          title="Next"
          onPress={() => { setPage(p => p + 1); fetchUsers(); }}
        />
      </View>
      <FlatList
        data={users}
        keyExtractor={(item) => item.user_id}
        renderItem={({ item }) => (
          <AdminListItem>
            <ThemedText style={styles.userId}>{item.user_id}</ThemedText>
            <StyledInput
              variant="filled"
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
  input: { paddingHorizontal: 8, borderRadius: 8, flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  separator: { height: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
});
