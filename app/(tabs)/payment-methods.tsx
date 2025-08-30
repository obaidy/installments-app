import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, Switch } from 'react-native';
import { CardField, useConfirmSetupIntent } from '@stripe/stripe-react-native';
import { ThemedText } from '../../components/ThemedText';
import { PrimaryButton } from '../../components/form/PrimaryButton';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../components/Toast';
import { API_BASE } from '../../lib/config';

type PM = { id: string; card?: { brand?: string; last4?: string; exp_month?: number; exp_year?: number } };

export default function PaymentMethodsScreen() {
  const { confirmSetupIntent } = useConfirmSetupIntent();
  const toast = useToast();
  const [unitId, setUnitId] = useState<number | null>(null);
  const [list, setList] = useState<PM[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autopay, setAutopay] = useState(false);

  useEffect(() => { (async () => {
    setLoading(true);
    // Pick first approved unit for this user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: units } = await supabase
      .from('units')
      .select('id, complex_id, client_complex_status!inner(status)')
      .eq('user_id', user.id)
      .eq('client_complex_status.status', 'approved')
      .limit(1);
    const id = (units as any[])?.[0]?.id as number | undefined;
    if (!id) { setLoading(false); return; }
    setUnitId(id);
    await refreshList(id);
    setLoading(false);
  })(); }, []);

  async function authHeaders() {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function refreshList(id: number) {
    const r = await fetch(`${API_BASE}/payments/pm/list?unit_id=${id}`, { headers: await authHeaders() });
    const d = await r.json();
    if (d?.ok) setList(d.paymentMethods || []);
    // Fetch autopay flag
    const { data } = await supabase.from('units').select('autopay_enabled').eq('id', id).single();
    setAutopay(!!(data as any)?.autopay_enabled);
  }

  async function handleAdd() {
    if (!unitId) return;
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/payments/pm/setup-intent`, { method: 'POST', headers: { 'content-type':'application/json', ...(await authHeaders()) }, body: JSON.stringify({ unit_id: unitId }) });
      const d = await r.json();
      if (!d.ok || !d.clientSecret) throw new Error(d?.error || 'Failed to create setup intent');
      const { error, setupIntent } = await confirmSetupIntent(d.clientSecret, { paymentMethodType: 'Card' });
      if (error) throw new Error(error.message);
      if (!setupIntent?.paymentMethodId) throw new Error('No payment method');
      // set default
      const setr = await fetch(`${API_BASE}/payments/pm/set-default`, { method: 'POST', headers: { 'content-type':'application/json', ...(await authHeaders()) }, body: JSON.stringify({ unit_id: unitId, paymentMethodId: setupIntent.paymentMethodId }) });
      const setd = await setr.json();
      if (!setd.ok) throw new Error(setd.error || 'Failed to set default');
      toast.show('Card saved');
      await refreshList(unitId);
    } catch (e: any) {
      toast.show(e?.message || 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function setDefault(id: string) {
    if (!unitId) return;
    const r = await fetch(`${API_BASE}/payments/pm/set-default`, { method: 'POST', headers: { 'content-type':'application/json', ...(await authHeaders()) }, body: JSON.stringify({ unit_id: unitId, paymentMethodId: id }) });
    const d = await r.json();
    if (!d?.ok) toast.show((await import('../../lib/apiError')).formatApiError(d?.error)); else toast.show('Default updated');
  }
  async function removePm(id: string) {
    if (!unitId) return;
    const r = await fetch(`${API_BASE}/payments/pm/detach`, { method: 'POST', headers: { 'content-type':'application/json', ...(await authHeaders()) }, body: JSON.stringify({ unit_id: unitId, paymentMethodId: id }) });
    const d = await r.json();
    if (!d?.ok) toast.show((await import('../../lib/apiError')).formatApiError(d?.error)); else { toast.show('Removed'); await refreshList(unitId); }
  }
  function renderItem({ item }: { item: PM }) {
    const label = `${item.card?.brand || ''} •••• ${item.card?.last4 || ''}  ${item.card?.exp_month}/${item.card?.exp_year}`;
    return (
      <View style={[styles.row, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <ThemedText>{label.trim()}</ThemedText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <PrimaryButton title="Make Default" onPress={() => setDefault(item.id)} />
          <PrimaryButton title="Remove" onPress={() => removePm(item.id)} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Payment Methods</ThemedText>
      {loading ? (
        <ThemedText>Loading…</ThemedText>
      ) : unitId ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <ThemedText>Autopay</ThemedText>
            <Switch value={autopay} onValueChange={async (v) => {
              setAutopay(v);
              const r = await fetch(`${API_BASE}/payments/autopay/set`, { method: 'POST', headers: { 'content-type':'application/json', ...(await authHeaders()) }, body: JSON.stringify({ unit_id: unitId, enabled: v }) });
              const d = await r.json();
              if (!d?.ok) toast.show((await import('../../lib/apiError')).formatApiError(d?.error)); else toast.show(v ? 'Autopay enabled' : 'Autopay disabled');
            }} />
          </View>
          <FlatList data={list} keyExtractor={(pm) => pm.id} renderItem={renderItem} ItemSeparatorComponent={() => <View style={{ height: 8 }} />} />
          <View style={{ height: 12 }} />
          <CardField postalCodeEnabled={false} placeholders={{ number: '4242 4242 4242 4242' }} style={{ width: '100%', height: 50 }} cardStyle={{ backgroundColor: 'white' }} />
          <View style={{ height: 12 }} />
          <PrimaryButton title={saving ? 'Saving…' : 'Add Card'} onPress={handleAdd} disabled={saving} />
        </>
      ) : (
        <ThemedText>No approved units found.</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  row: { padding: 12, backgroundColor: '#fff', borderRadius: 8 },
});

