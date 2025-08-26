import { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabaseClient';
import useAuthorization from '../../hooks/useAuthorization';
import { ThemedText } from '@/components/ThemedText';

type Unit = { id: number; name: string; complex_id: number };

export default function UnitsScreen() {
  const [units, setUnits] = useState<Unit[]>([]);
  const { authorized, loading } = useAuthorization(['user']);
  const router = useRouter();

  useEffect(() => {

  if (authorized) {
      fetchUnits();
    
    }
  }, [authorized]);


  async function fetchUnits() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('units')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data) setUnits(data);
  }

  function renderItem({ item }: { item: Unit }) {
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => router.push(`/units/${item.id}`)}
      >
        <ThemedText>{item.name}</ThemedText>
      </TouchableOpacity>
    );
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
      <FlatList
        data={units}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  item: { padding: 12, backgroundColor: '#fff', borderRadius: 4 },
  separator: { height: 10 },
});
