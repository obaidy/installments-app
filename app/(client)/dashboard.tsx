import { View, Text, FlatList, SafeAreaView, ScrollView, RefreshControl, TouchableOpacity, Switch, Alert, I18nManager, Modal } from 'react-native';
import { useEffect, useState, useCallback, useMemo } from 'react';
import MoneySummary, { type MoneyBuckets } from '../../components/MoneySummary';
import InstallmentCard, { type Installment } from '../../components/InstallmentCard';
import { createCheckout, createBatchCheckout } from '../../lib/api/payments';
import { supabase, signOut } from '../../lib/supabaseClient';
import { useRouter } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../../lib/config';
import ClientHeader from '../../components/ClientHeader';
import { useToast } from '../../components/Toast';

type UnitInfo = { id: number; name?: string | null; service_fee?: number | null; autopay_enabled?: boolean | null };
type Payment = { id: number; amount: number; status: string; paid_at: string | null; type: 'installment'|'service_fee' };

export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const toast = useToast();
  const isRTL = I18nManager.isRTL;

  const [items, setItems] = useState<Installment[]>([]);
  const [buckets, setBuckets] = useState<MoneyBuckets>({
    today: 0,
    next30: 0,
    pastDue: 0,
  });
  const [units, setUnits] = useState<UnitInfo[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showPayAll, setShowPayAll] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id;
      setUserEmail(user?.email ?? null);
      if (!uid) { setItems([]); setUnits([]); setPayments([]); return; }

      // Parallel: dues, units, recent payments
      const [duesRes, unitsRes] = await Promise.all([
        supabase
          .from('v_user_dues')
          .select('id, unit_id, amount_iqd, due_date, paid, paid_at, type, user_id')
          .eq('user_id', uid)
          .order('due_date', { ascending: true })
          .limit(100),
        supabase
          .from('units')
          .select('id, name, service_fee, autopay_enabled')
          .eq('user_id', uid),
      ]);

      const list = ((duesRes.data as any[]) || []) as Installment[];
      setItems(list);
      setUnits(((unitsRes.data as any[]) || []) as UnitInfo[]);

      // Compute buckets
      const today = new Date();
      const todayStr = today.toDateString();
      const in30 = new Date();
      in30.setDate(in30.getDate() + 30);
      let pastDue = 0; let next30 = 0; let todayDue = 0;
      for (const i of list) {
        if (i.paid || i.paid_at) continue;
        const d = new Date(i.due_date);
        if (d.toDateString() === todayStr) todayDue += i.amount_iqd;
        else if (d > today && d <= in30) next30 += i.amount_iqd;
        else if (d < today) pastDue += i.amount_iqd;
      }
      setBuckets({ today: todayDue, next30, pastDue });

      // Recent paid payments (limit 5)
      const unitIds = (unitsRes.data as any[])?.map((u: any) => u.id) || [];
      if (unitIds.length) {
        const paid = await supabase
          .from('payments')
          .select('id, amount, status, paid_at, installment_id, service_fee_id')
          .in('unit_id', unitIds)
          .eq('status', 'paid')
          .order('paid_at', { ascending: false })
          .limit(5);
        const mapped = ((paid.data as any[]) || []).map((p: any) => ({ id: p.id as number, amount: Number(p.amount), status: String(p.status), paid_at: p.paid_at as string | null, type: p.service_fee_id ? 'service_fee' : 'installment' } as Payment));
        setPayments(mapped);
      } else {
        setPayments([]);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handlePay = useCallback(
    async (i: Installment) => {
      // Biometric Quick Pay (optional)
      try {
        const LocalAuthentication = await import('expo-local-authentication');
        const avail = await LocalAuthentication.hasHardwareAsync();
        const enrolled = avail ? await LocalAuthentication.isEnrolledAsync() : false;
        if (enrolled) {
          const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Confirm Payment' });
          if (!res.success) return;
        }
      } catch {}

      const metadata: Record<string, string> = {
        unit_id: String(i.unit_id),
      };
      if (i.type === 'service_fee') metadata.service_fee_id = String(i.id);
      else metadata.installment_id = String(i.id);

      const { referenceId } = await createCheckout(
        i.amount_iqd,
        i.type === 'service_fee' ? `Service Fee ${i.id}` : `Installment ${i.id}`,
        metadata,
        { type: i.type ?? 'installment', id: i.id }
      );

    if (referenceId) {
        // Route exists under /(client)/units/payments/[ref]
        router.push(`/(client)/units/payments/${encodeURIComponent(referenceId)}`);
      }
    },
    [router],
  );

  const [coachTarget, setCoachTarget] = useState<Installment | null>(null);
  const handlePromise = useCallback(async (i: Installment) => {
    // Open Smart Promise Coach
    setCoachTarget(i);
  }, []);

  const handlePayAll = useCallback(() => {
    const unpaid = items.filter(i => !(i.paid || i.paid_at));
    if (unpaid.length === 0) return;
    setShowPayAll(true);
  }, [items]);

  const nextDue = useMemo(() => items.filter(i => !(i.paid || i.paid_at)).sort((a,b)=>new Date(a.due_date).getTime()-new Date(b.due_date).getTime())[0], [items]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <ClientHeader />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadAll} />}
        contentContainerStyle={{ padding: 16, gap: 16 }}
      >
        {/* Header */}
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <ThemedText type="subtitle">{t('welcome')}</ThemedText>
            <ThemedText>{userEmail || t('client')}</ThemedText>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={async () => { await signOut(); router.replace('/auth/Login'); }}
            style={{ backgroundColor: '#111827', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <MoneySummary buckets={buckets} />

        {/* Quick actions */}
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 12 }}>
          <QuickAction label={t('quickMethods')} icon="card-outline" onPress={() => router.push('/(client)/payment-methods')} />
          <QuickAction label={t('quickHistory')} icon="receipt-outline" onPress={() => router.push('/payments/history')} />
          <QuickAction label={t('quickUpcoming')} icon="time-outline" onPress={() => router.push('/payments/upcoming')} />
        </View>

        {/* Next payment */}
        {nextDue ? (
          <View style={{ gap: 8 }}>
            <ThemedText type="subtitle">{t('nextPayment')}</ThemedText>
            <InstallmentCard item={nextDue} onPay={handlePay} onPromise={handlePromise} />
          </View>
        ) : null}

        {/* Services & Fees */}
        <View style={{ gap: 8 }}>
          <ThemedText type="subtitle">{t('servicesFees')}</ThemedText>
          {units.length === 0 ? (
            <Card><ThemedText>{t('noUnits')}</ThemedText></Card>
          ) : (
            units.map(u => (
              <Card key={u.id}>
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontWeight: '600' }}>{u.name || `${t('unit')} #${u.id}`}</Text>
                      <Text style={{ color: '#6B7280' }}>{t('serviceFee')}: {Number(u.service_fee ?? 0).toLocaleString()} IQD</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(client)/payment-methods')} style={{ backgroundColor: '#111827', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 }}>
                      <Text style={{ color: 'white', fontWeight: '700' }}>{u.autopay_enabled ? t('manage') : t('setup')}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#6B7280' }}>{t('autopay')}</Text>
                    <Switch value={!!u.autopay_enabled} onValueChange={async (v) => {
                      try {
                        const { data: session } = await supabase.auth.getSession();
                        const token = session.session?.access_token;
                        const r = await fetch(`${API_BASE}/payments/autopay/set`, { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ unit_id: u.id, enabled: v }) });
                        const d = await r.json();
                        if (!d?.ok) throw new Error(d?.error || 'Failed');
                        setUnits(prev => prev.map(x => x.id === u.id ? { ...x, autopay_enabled: v } : x));
                        toast.show(v ? t('autopay') + ' ON' : t('autopay') + ' OFF');
                      } catch (e: any) {
                        toast.show(e?.message || 'Error');
                      }
                    }} />
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Upcoming & Due (preview) */}
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <ThemedText type="subtitle">{t('upcomingAndDue')}</ThemedText>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={handlePayAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="cash-outline" size={18} color="#111827" />
                <ThemedText type="link">{t('payAll')}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/payments/upcoming')}><ThemedText type="link">{t('seeAll')}</ThemedText></TouchableOpacity>
            </View>
          </View>
          {items.length === 0 ? (
            <Card><ThemedText>{t('noDues')}</ThemedText></Card>
          ) : (
            <View style={{ gap: 12 }}>
              {items.slice(0, 5).map((item, idx) => (
                <InstallmentCard key={`${item.id}-${idx}`} item={item} onPay={handlePay} onPromise={handlePromise} />
              ))}
            </View>
          )}
        </View>

        {/* Recent Payments */}
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <ThemedText type="subtitle">{t('recentPayments')}</ThemedText>
            <TouchableOpacity onPress={() => router.push('/payments/history')}><ThemedText type="link">{t('seeAll')}</ThemedText></TouchableOpacity>
          </View>
          {payments.length === 0 ? (
            <Card><ThemedText>{t('noPayments')}</ThemedText></Card>
          ) : (
            <View style={{ gap: 8 }}>
              {payments.map(p => (
                <Card key={p.id}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontWeight: '600' }}>{(p.amount || 0).toLocaleString()} IQD</Text>
                    <Text style={{ color: '#6B7280' }}>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : ''}</Text>
                  </View>
                  <Text style={{ color: '#6B7280' }}>{p.type === 'service_fee' ? t('typeServiceFee') : t('typeInstallment')}</Text>
                </Card>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Pay All confirmation modal */}
      <PayAllModal
        visible={showPayAll}
        onClose={() => setShowPayAll(false)}
        items={items.filter(i => !(i.paid || i.paid_at))}
        onConfirm={async (targets) => {
          setShowPayAll(false);
          try {
            const unitId = targets[0]?.unit_id as number;
            const items = targets.map((x) => ({ type: (x.type ?? 'installment') as 'installment'|'service_fee', id: x.id }));
            const { referenceId } = await createBatchCheckout(unitId, items);
            if (referenceId) router.push(`/(client)/units/payments/${encodeURIComponent(referenceId)}`);
          } catch (e: any) {
            toast.show(e?.message || 'Error');
          }
        }}
      />

      {/* Smart Promise Coach */}
      <PromiseCoachModal
        target={coachTarget}
        onClose={() => setCoachTarget(null)}
        onSelect={async (date) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user || !coachTarget) return;
          await supabase.from('promises').insert({ user_id: user.id, target_type: coachTarget.type ?? 'installment', target_id: coachTarget.id, promise_date: date.toISOString().slice(0,10) });
          setCoachTarget(null);
          toast.show('Promise saved');
        }}
      />
    </SafeAreaView>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}>
      {children}
    </View>
  );
}

function PromiseCoachModal({ target, onClose, onSelect }: { target: Installment | null; onClose: () => void; onSelect: (date: Date) => void }) {
  const { t } = useTranslation();
  if (!target) return null as any;
  // Heuristics: suggest this Friday, next 5th, or in 7 days
  const now = new Date();
  const in7 = new Date(now); in7.setDate(in7.getDate() + 7);
  const thisFriday = (() => { const d = new Date(now); const day = d.getDay(); const diff = (5 - day + 7) % 7; d.setDate(d.getDate() + (diff === 0 ? 7 : diff)); return d; })();
  const next5th = (() => { const d = new Date(now); if (d.getDate() >= 5) { d.setMonth(d.getMonth() + 1); } d.setDate(5); return d; })();
  const options = [thisFriday, next5th, in7];
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', padding: 24, justifyContent: 'center' }}>
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10 }}>Smart Promise Coach</Text>
          {options.map((d, idx) => (
            <TouchableOpacity key={idx} onPress={() => onSelect(d)} style={{ paddingVertical: 10 }}>
              <Text>{d.toDateString()}</Text>
            </TouchableOpacity>
          ))}
          <View style={{ height: 12 }} />
          <TouchableOpacity onPress={onClose} style={{ alignSelf: 'flex-end' }}><Text style={{ color: '#111827', fontWeight: '700' }}>{t('cancel')}</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function QuickAction({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1, gap: 8 }}
    >
      <Ionicons name={icon} size={22} color="#111827" />
      <Text style={{ fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function PayAllModal({ visible, items, onClose, onConfirm }: { visible: boolean; items: Installment[]; onClose: () => void; onConfirm: (i: Installment[]) => void }) {
  const { t } = useTranslation();
  const total = items.reduce((sum, i) => sum + (i.paid || i.paid_at ? 0 : i.amount_iqd), 0);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', padding: 24, justifyContent: 'center' }}>
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, maxHeight: '80%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '700' }}>{t('payAll')}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close-outline" size={22} color="#111827" /></TouchableOpacity>
          </View>
          <View style={{ gap: 6, marginBottom: 8 }}>
            {items.map((i) => (
              <View key={`payall-${i.type}-${i.id}`} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#6B7280' }}>{i.type === 'service_fee' ? t('typeServiceFee') : t('typeInstallment')} #{i.id}</Text>
                <Text style={{ fontWeight: '600' }}>{Number(i.amount_iqd).toLocaleString()} IQD</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={{ fontWeight: '700' }}>{t('totalDueToday')}</Text>
            <Text style={{ fontWeight: '700' }}>{Number(total).toLocaleString()} IQD</Text>
          </View>
          <View style={{ height: 12 }} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#E5E7EB', alignItems: 'center' }}>
              <Text style={{ fontWeight: '700' }}>{t('cancel') || 'Cancel'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onConfirm(items)} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#111827', alignItems: 'center' }}>
              <Text style={{ color: 'white', fontWeight: '700' }}>{t('confirm') || 'Confirm'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
