import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabaseClient';
import { ThemedText } from '@/components/ThemedText';

type DueItem = {
  id: number;
  amount_iqd: number;
  due_date: string | null;
  paid: boolean;
};

export default function UpcomingInstallmentsScreen() {
  const [dues, setDues] = useState<DueItem[]>([]);

  useEffect(() => {
    fetchDues();
  }, []);

  async function fetchDues() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('v_user_dues')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });

   if (!error && data) setDues(data as DueItem[]);
  }

  function renderItem({ item }: { item: DueItem }) {
    return (
      <View style={styles.item}>
        <ThemedText>Amount: {item.amount_iqd}</ThemedText>
        <ThemedText>
          Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : ''}
        </ThemedText>
        <ThemedText>Paid: {item.paid ? 'Yes' : 'No'}</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Upcoming Installments</ThemedText>
      <FlatList
        data={dues}
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
