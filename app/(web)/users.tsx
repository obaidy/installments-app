import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { supabase } from '../../lib/supabaseClient';
import useAuthorization from '../../hooks/useAuthorization';
import { StyledInput } from '../../components/form/StyledInput';
import { PrimaryButton } from '../../components/form/PrimaryButton';

type UserRole = { user_id: string; role: string };

export default function UsersAdminScreen() {
  const { authorized, loading } = useAuthorization('admin');
  const [users, setUsers] = useState<UserRole[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});

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
      <ThemedText type="title">Users</ThemedText>
      <FlatList
        data={users}
        keyExtractor={(item) => item.user_id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <ThemedText>{item.user_id}</ThemedText>
            <StyledInput
              style={styles.input}
              value={editing[item.user_id] ?? ''}
              placeholder={item.role}
              onChangeText={(text) =>
                setEditing((e) => ({ ...e, [item.user_id]: text }))
              }
            />
            <PrimaryButton
              title="Update"
              onPress={() => updateRole(item.user_id)}
            />
            <PrimaryButton
              title="Delete"
              onPress={() => deleteRole(item.user_id)}
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