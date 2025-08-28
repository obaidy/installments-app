import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { supabase } from '../../lib/supabaseClient';
import useAuthorization from '../../hooks/useAuthorization';
import AdminLayout from './AdminLayout';
import { AdminListItem } from '../../components/admin/AdminListItem';

type Complex = { id: number; name: string };

export default function AdminScreen() {
  const [complexes, setComplexes] = useState<Complex[]>([]);
   const { authorized, loading } = useAuthorization('admin');

  useEffect(() => {
    if (authorized) {
      supabase
        .from('complexes')
        .select('*')
        .then(({ data }) => {
          if (data) setComplexes(data);
        });
    }
  }, [authorized]);

  if (!authorized && !loading) {
    return (
      <AdminLayout title="Admin Portal">
        <ThemedText>Access denied</ThemedText>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="Admin Portal">
        <ThemedText>Loading...</ThemedText>
      </AdminLayout>
    );
  }


  return (
    <AdminLayout title="Admin Portal">
      <FlatList
        data={complexes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <AdminListItem>
            <ThemedText>{item.name}</ThemedText>
          </AdminListItem>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  separator: { height: 12 },
});
