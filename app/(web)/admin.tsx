import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { supabase, getCurrentUserRole } from '../../lib/supabaseClient';


type Complex = { id: number; name: string };

export default function AdminScreen() {
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);
  async function checkAccess() {
    const role = await getCurrentUserRole();
    if (role === 'admin') {
      setAuthorized(true);
      supabase
        .from('complexes')
        .select('*')
        .then(({ data }) => {
          if (data) setComplexes(data);
        });
    } else {
      setAuthorized(false);
    }
  }

  if (authorized === false) {
    return (
      <View style={styles.container}>
        <ThemedText>Access denied</ThemedText>
      </View>
    );
  }

  if (authorized === null) {
    return (
      <View style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <ThemedText type="title">Admin Portal</ThemedText>
      <FlatList
        data={complexes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ThemedText>{item.name}</ThemedText>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
