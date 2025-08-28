import { View, Text } from 'react-native';

export function AdminEmpty({ title = 'No data', subtitle }: { title?: string; subtitle?: string }) {
  return (
    <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 6 }}>{title}</Text>
      {subtitle ? <Text style={{ opacity: 0.7 }}>{subtitle}</Text> : null}
    </View>
  );
}

