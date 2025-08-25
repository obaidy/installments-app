import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Link } from 'expo-router';
import AdminLayout from './AdminLayout';
import { PrimaryButton } from '../../components/form/PrimaryButton';
import { getCurrentUserRole } from '../../lib/supabaseClient';

export default function AdminDashboard() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    getCurrentUserRole().then((role) => {
      setAuthorized(role === 'admin');
    });
  }, []);

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
      <Link href="/(web)/users" asChild>
        <PrimaryButton title="Manage Users" style={styles.button} />
      </Link>
      <Link href="/(web)/complexes" asChild>
        <PrimaryButton title="Manage Complexes" style={styles.button} />
      </Link>
      <Link href="/(web)/units" asChild>
        <PrimaryButton title="Manage Units" style={styles.button} />
      </Link>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  button: { marginTop: 12 },
});