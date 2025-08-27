import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { getCurrentUserRole } from '@/lib/supabaseClient';

export default function DashboardAlias() {
  useEffect(() => {
    async function go() {
      const role = await getCurrentUserRole();
      if (role === 'admin') router.replace('/(web)');
      else if (role === 'manager') router.replace('/(manager)');
      else if (role) router.replace('/(tabs)');
      else router.replace('/auth/Login');
    }
    go();
  }, []);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
      <ThemedText>Loading dashboard…</ThemedText>
    </View>
  );
}

