import { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabaseClient';
import { ThemedText } from '@/components/ThemedText';

type Unit = { id: number; name: string; complex_id: number };

export default function UnitsScreen() {
  const [units, setUnits] = useState<Unit[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchUnits();
  }, []);

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
        onPress={() => router.push(`/payments/checkout?unit=${item.id}`)}
      >
        <ThemedText>{item.name}</ThemedText>
      </TouchableOpacity>
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
