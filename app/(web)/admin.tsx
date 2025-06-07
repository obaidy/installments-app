import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { supabase } from '@/lib/supabaseClient';

type Complex = { id: number; name: string };

export default function AdminScreen() {
  const [complexes, setComplexes] = useState<Complex[]>([]);

  useEffect(() => {
    supabase
      .from('complexes')
      .select('*')
      .then(({ data }) => {
        if (data) setComplexes(data);
      });
  }, []);

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
