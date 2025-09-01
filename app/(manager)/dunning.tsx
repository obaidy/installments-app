import { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { PrimaryButton } from '../../components/form/PrimaryButton';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../components/Toast';

type PastDue = { id: number; unit_id: number; due_date: string; amount_iqd: number; unit_name?: string };

export default function DunningScreen() {
  const [items, setItems] = useState<PastDue[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [sending, setSending] = useState(false);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('installments')
        .select('id, unit_id, amount_iqd, due_date, units(name)')
        .eq('paid', false)
        .lt('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(200);
      const mapped = (data || []).map((r: any) => ({
        id: r.id, unit_id: r.unit_id, amount_iqd: r.amount_iqd, due_date: r.due_date, unit_name: r.units?.name,
      })) as PastDue[];
      setItems(mapped);
    })();
  }, []);

  function toggle(id: number) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  async function bulkSend() {
    const ids = Object.keys(selected).filter((k) => selected[Number(k)]).map(Number);
    
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('dunning-bulk-send', {
        body: { installments: ids },
      });
      if (error) throw error;
      toast.show('Reminders sent');
    } catch (e: any) {
      toast.show(e?.message || 'Failed to send reminders');
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <ThemedText type="title">Dunning</ThemedText>
      <ThemedText>Past-due installments. Select and bulk send reminders.</ThemedText>
      <PrimaryButton title={sending ? 'Sending…' : 'Bulk Send'} onPress={bulkSend} disabled={sending} />
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <ThemedText>{item.unit_name || `Unit ${item.unit_id}`}</ThemedText>
              <ThemedText>{new Date(item.due_date).toLocaleDateString()}</ThemedText>
              <ThemedText>{item.amount_iqd} IQD</ThemedText>
            </View>
            <PrimaryButton
              title={selected[item.id] ? 'Selected' : 'Select'}
              onPress={() => toggle(item.id)}
            />
          </View>
        )}
      />
    </View>
  );
}

