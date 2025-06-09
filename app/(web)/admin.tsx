import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { supabase } from '../../lib/supabaseClient';
import useAuthorization from '../../hooks/useAuthorization';


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
