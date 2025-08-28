import { View, ActivityIndicator, Text } from 'react-native';

export function AdminLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
      <Text style={{ marginTop: 8 }}>{label}</Text>
    </View>
  );
}

