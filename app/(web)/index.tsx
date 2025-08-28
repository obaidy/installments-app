import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { router } from 'expo-router';
import AdminLayout from './AdminLayout';
import { PrimaryButton } from '../../components/form/PrimaryButton';
import { getCurrentUserRole } from '../../lib/supabaseClient';
import { MetricCard } from '../../components/admin/MetricCard';
import { supabase } from '../../lib/supabaseClient';

export default function AdminDashboard() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [counts, setCounts] = useState<{ users: number; complexes: number; units: number; unpaid: number }>({ users: 0, complexes: 0, units: 0, unpaid: 0 });

  useEffect(() => {
    getCurrentUserRole().then((role) => {
      setAuthorized(role === 'admin');
    });
  }, []);

  useEffect(() => {
    async function fetchCounts() {
      const [users, complexes, units, unpaid] = await Promise.all([
        supabase.from('user_roles').select('*', { count: 'exact', head: true }),
        supabase.from('complexes').select('*', { count: 'exact', head: true }),
        supabase.from('units').select('*', { count: 'exact', head: true }),
        supabase.from('installments').select('*', { count: 'exact', head: true }).eq('paid', false),
      ]);
      setCounts({
        users: users.count || 0,
        complexes: complexes.count || 0,
        units: units.count || 0,
        unpaid: unpaid.count || 0,
      });
    }
    if (authorized) fetchCounts();
  }, [authorized]);

  if (authorized === false) {
    return (
      <AdminLayout title="Admin Dashboard">
        <ThemedText>Access denied</ThemedText>
      </AdminLayout>
    );
  }

  if (authorized === null) {
    return (
      <AdminLayout title="Admin Dashboard">
        <ThemedText>Loading...</ThemedText>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Admin Dashboard">
      <View style={styles.metricsRow}>
        <MetricCard label="Users" value={counts.users} />
        <MetricCard label="Complexes" value={counts.complexes} />
        <MetricCard label="Units" value={counts.units} />
        <MetricCard label="Unpaid Installments" value={counts.unpaid} />
      </View>
      <PrimaryButton title="Manage Users" style={styles.button} onPress={() => router.push('/(web)/users')} />
      <PrimaryButton title="Manage Complexes" style={styles.button} onPress={() => router.push('/(web)/complexes')} />
      <PrimaryButton title="Manage Units" style={styles.button} onPress={() => router.push('/(web)/units')} />
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  button: { marginTop: 12 },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
});
