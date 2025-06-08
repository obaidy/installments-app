import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
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
      <View style={styles.container}>
        <ThemedText>Access denied</ThemedText>
      </View>
    );
  }

  if (authorized === null) {
    return (
      <View style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Admin Dashboard</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});