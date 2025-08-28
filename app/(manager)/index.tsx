import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { PrimaryButton } from '../../components/form/PrimaryButton';
import { supabase } from '../../lib/supabaseClient';
import useAuthorization from '../../hooks/useAuthorization';
import { MetricCard } from '../../components/admin/MetricCard';

type ManagedComplex = { id: number; name: string };

export default function ManagerDashboard() {
  const [complexes, setComplexes] = useState<ManagedComplex[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<{ complexes: number; units: number }>({ complexes: 0, units: 0 });

  useEffect(() => {
    async function fetchComplexes() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_complexes')
        .select('complexes ( id, name )')
        .eq('user_id', user.id);

      if (data) {
        const complexes = data.flatMap(entry => entry.complexes) as ManagedComplex[];
        setComplexes(complexes);
        const complexIds = complexes.map(c => c.id);
        if (complexIds.length) {
          const { count } = await supabase
            .from('units')
            .select('*', { count: 'exact', head: true })
            .in('complex_id', complexIds);
          setCounts({ complexes: complexes.length, units: count || 0 });
        } else {
          setCounts({ complexes: 0, units: 0 });
        }
      }

      setLoading(false);
    }

    fetchComplexes();
  }, []);

  const { authorized, loading: authLoading } = useAuthorization('manager');

  if (loading || authLoading) {
    return (
      <View style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  if (!authorized) {
    return (
      <View style={styles.container}>
        <ThemedText>Access denied</ThemedText>
      </View>
    );
  }

  if (complexes.length === 0) {
    return (
      <View style={styles.container}>
        <ThemedText type="title">Manager Dashboard</ThemedText>
        <View style={styles.metricsRow}>
          <MetricCard label="Your Complexes" value={0} />
          <MetricCard label="Total Units" value={0} />
        </View>
        <ThemedText>No complexes assigned to your account yet.</ThemedText>
        <ThemedText>Ask an admin to assign you to a complex.</ThemedText>
        <PrimaryButton title="Sign Out" onPress={async () => { await (await import('../../lib/supabaseClient')).signOut(); router.replace('/auth/Login'); }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Manager Dashboard</ThemedText>
      <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'flex-end' }}>
        <PrimaryButton
          title="Dunning"
          onPress={() => router.push('/(manager)/dunning')}
        />
        <PrimaryButton
          title="Sign Out"
          onPress={async () => { await (await import('../../lib/supabaseClient')).signOut(); router.replace('/auth/Login'); }}
        />
      </View>
      <View style={{ alignSelf: 'flex-end' }}>
        <PrimaryButton
          title="Sign Out"
          onPress={async () => { await (await import('../../lib/supabaseClient')).signOut(); router.replace('/auth/Login'); }}
        />
      </View>
      <View style={styles.metricsRow}>
        <MetricCard label="Your Complexes" value={counts.complexes} />
        <MetricCard label="Total Units" value={counts.units} />
      </View>
      {complexes.map((complex) => (
        <View key={complex.id} style={styles.complexSection}>
          <ThemedText type="subtitle">{complex.name}</ThemedText>
          <PrimaryButton
            title="Manage Units"
            style={styles.button}
            onPress={() => router.push(`/(web)/units?complexId=${complex.id}`)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  complexSection: { gap: 8 },
  button: { marginTop: 4 },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
});
