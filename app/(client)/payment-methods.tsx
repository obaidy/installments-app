import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, Switch, SafeAreaView } from 'react-native';
import { CardField, useConfirmSetupIntent } from '@stripe/stripe-react-native';
import { ThemedText } from '../../components/ThemedText';
import { PrimaryButton } from '../../components/form/PrimaryButton';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../components/Toast';
import { API_BASE } from '../../lib/config';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import ClientHeader from '../../components/ClientHeader';
import { TextInput } from 'react-native';

type PM = { id: string; card?: { brand?: string; last4?: string; exp_month?: number; exp_year?: number } };

export default function ClientPaymentMethods() {
  const { confirmSetupIntent } = useConfirmSetupIntent();
  const toast = useToast();
  const { t } = useTranslation();
  const [unitId, setUnitId] = useState<number | null>(null);
  const [list, setList] = useState<PM[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autopay, setAutopay] = useState(false);
  const [autopayDay, setAutopayDay] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [topup, setTopup] = useState<string>('');

  useEffect(() => { (async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: units } = await supabase
      .from('units')
      .select('id, complex_id, client_complex_status!inner(status), autopay_enabled')
      .eq('user_id', user.id)
      .eq('client_complex_status.status', 'approved')
      .limit(1);
    const id = (units as any[])?.[0]?.id as number | undefined;
    if (!id) { setLoading(false); return; }
    setUnitId(id);
    await refreshList(id);
    setLoading(false);
  })(); }, []);

  const authHeaders = useCallback(async () => {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  async function refreshList(id: number) {
    const r = await fetch(`${API_BASE}/payments/pm/list?unit_id=${id}`, { headers: await authHeaders() });
    const d = await r.json();
    if (d?.ok) setList(d.paymentMethods || d.data || []);
    const { data } = await supabase.from('units').select('autopay_enabled, autopay_day').eq('id', id).single();
    setAutopay(!!(data as any)?.autopay_enabled);
    setAutopayDay(((data as any)?.autopay_day as number|undefined) ?? null);
    // Wallet balance
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: w } = await supabase.from('wallets').select('balance').eq('user_id', user.id).maybeSingle();
      setWalletBalance(Number((w as any)?.balance || 0));
    }
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
      const setr = await fetch(`${API_BASE}/payments/pm/set-default`, { method: 'POST', headers: { 'content-type':'application/json', ...(await authHeaders()) }, body: JSON.stringify({ unit_id: unitId, paymentMethodId: setupIntent.paymentMethodId }) });
      const setd = await setr.json();
      if (!setd.ok) throw new Error(setd.error || 'Failed to set default');
      toast.show(t('paymentMethods') + ': ' + t('manage'));
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
    if (!d?.ok) toast.show((await import('../../lib/apiError')).formatApiError(d?.error)); else toast.show('OK');
  }
  async function removePm(id: string) {
    if (!unitId) return;
    const r = await fetch(`${API_BASE}/payments/pm/detach`, { method: 'POST', headers: { 'content-type':'application/json', ...(await authHeaders()) }, body: JSON.stringify({ unit_id: unitId, paymentMethodId: id }) });
    const d = await r.json();
    if (!d?.ok) toast.show((await import('../../lib/apiError')).formatApiError(d?.error)); else { toast.show('Removed'); await refreshList(unitId); }
  }

  function renderItem({ item }: { item: PM }) {
    const label = `${item.card?.brand || ''} •••• ${item.card?.last4 || ''}  ${item.card?.exp_month}/${item.card?.exp_year}`.trim();
    return (
      <View style={styles.cardRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="card-outline" size={20} color="#111827" />
          <ThemedText>{label}</ThemedText>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <PrimaryButton title={t('manage')} onPress={() => setDefault(item.id)} />
          <PrimaryButton title={t('remove') || 'Remove'} onPress={() => removePm(item.id)} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ClientHeader title={t('paymentMethods')} insetTop={false} />
      <View style={{ padding: 16, gap: 12 }}>
        {loading ? (
          <ThemedText>{t('loading')}</ThemedText>
        ) : unitId ? (
          <>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <ThemedText>{t('autopay')}</ThemedText>
            <Switch value={autopay} onValueChange={async (v) => {
              setAutopay(v);
              const r = await fetch(`${API_BASE}/payments/autopay/set`, { method: 'POST', headers: { 'content-type':'application/json', ...(await authHeaders()) }, body: JSON.stringify({ unit_id: unitId, enabled: v }) });
              const d = await r.json();
              if (!d?.ok) toast.show((await import('../../lib/apiError')).formatApiError(d?.error)); else toast.show(v ? 'ON' : 'OFF');
            }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <ThemedText>{t('smartAutopayDay') || 'Autopay Day'}</ThemedText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PrimaryButton title="-" onPress={async () => {
                const next = Math.max(1, (autopayDay || 1) - 1);
                setAutopayDay(next);
                await supabase.from('units').update({ autopay_day: next }).eq('id', unitId);
              }} />
              <ThemedText>{String(autopayDay ?? '-')}</ThemedText>
              <PrimaryButton title="+" onPress={async () => {
                const next = Math.min(28, (autopayDay || 1) + 1);
                setAutopayDay(next);
                await supabase.from('units').update({ autopay_day: next }).eq('id', unitId);
              }} />
            </View>
          </View>

            <FlatList data={list} keyExtractor={(pm) => pm.id} renderItem={renderItem} ItemSeparatorComponent={() => <View style={{ height: 8 }} />} />
            <View style={{ height: 12 }} />
          <CardField postalCodeEnabled={false} placeholders={{ number: '4242 4242 4242 4242' }} style={{ width: '100%', height: 50 }} cardStyle={{ backgroundColor: 'white' }} />
          <View style={{ height: 12 }} />
          <PrimaryButton title={saving ? t('saving') || 'Saving…' : t('addCard') || 'Add Card'} onPress={handleAdd} disabled={saving} />

          {/* Wallet Top-up */}
          <View style={{ height: 12 }} />
          <View style={styles.cardRow}>
            <View style={{ gap: 6 }}>
              <ThemedText style={{ fontWeight: '700' }}>{t('wallet') || 'Wallet'}</ThemedText>
              <ThemedText>{t('balance') || 'Balance'}: {Number(walletBalance).toLocaleString()} IQD</ThemedText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                value={topup}
                onChangeText={setTopup}
                placeholder={t('amountIQD') || 'Amount'}
                keyboardType="numeric"
                style={{ backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, minWidth: 100 }}
              />
              <PrimaryButton title={t('topup') || 'Top up'} onPress={async () => {
                const amount = Number(topup);
                if (!Number.isFinite(amount) || amount <= 0) { toast.show('Invalid amount'); return; }
                const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
                const r = await fetch(`${API_BASE}/payments/wallet/topup`, { method: 'POST', headers: { 'content-type':'application/json', ...(await authHeaders()) }, body: JSON.stringify({ amountIQD: amount }) });
                const d = await r.json();
                if (!d?.ok) toast.show(d?.error || 'Failed'); else { setWalletBalance(b => b + amount); setTopup(''); toast.show('Topped up'); }
              }} />
            </View>
          </View>
          </>
        ) : (
          <ThemedText>{t('noUnits')}</ThemedText>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardRow: { padding: 16, backgroundColor: '#fff', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
});
