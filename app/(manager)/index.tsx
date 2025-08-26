import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { PrimaryButton } from '../../components/form/PrimaryButton';
import { supabase } from '../../lib/supabaseClient';
import useComplexAuthorization from '../../hooks/useComplexAuthorization';

type ManagedComplex = { id: number; name: string };

export default function ManagerDashboard() {
  const [complexes, setComplexes] = useState<ManagedComplex[]>([]);
  const [loading, setLoading] = useState(true);

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
        .from('complex_roles')
        .select('complex_id, complexes(name)')
        .eq('user_id', user.id)
        .eq('role', 'manager');

      if (data) {
        setComplexes(
          data.map((r: any) => ({
            id: r.complex_id,
            name: r.complexes?.name ?? `Complex ${r.complex_id}`,
          }))
        );
      }

      setLoading(false);
    }

    fetchComplexes();
  }, []);

  const firstComplexId = complexes.length > 0 ? complexes[0].id : null;
  const { authorized, loading: authLoading } = useComplexAuthorization(
    firstComplexId,
    'manager'
  );

  if (loading || authLoading) {
    return (
      <View style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  if (complexes.length === 0 || !authorized) {
    return (
      <View style={styles.container}>
        <ThemedText>Access denied</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Manager Dashboard</ThemedText>
      {complexes.map((complex) => (
        <View key={complex.id} style={styles.complexSection}>
          <ThemedText type="subtitle">{complex.name}</ThemedText>
          <Link href={`/(web)/units?complexId=${complex.id}`} asChild>
            <PrimaryButton title="Manage Units" style={styles.button} />
          </Link>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  complexSection: { gap: 8 },
  button: { marginTop: 4 },
});