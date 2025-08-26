// components/MoneySummary.tsx
import { View, Text } from 'react-native';
import { formatIQD } from '../lib/format';

export type MoneyBuckets = { today: number; next30: number; pastDue: number };

export default function MoneySummary({ buckets }: { buckets: MoneyBuckets }) {
  const Card = (title: string, amount: number) => (
    <View style={{ flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
      <Text style={{ color: '#6B7280', marginBottom: 6 }}>{title}</Text>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>{formatIQD(amount)}</Text>
    </View>
  );

  return (
    <View style={{ gap: 12, flexDirection: 'row' }}>
      {Card('Today', buckets.today)}
      {Card('Next 30d', buckets.next30)}
      {Card('Past due', buckets.pastDue)}
    </View>
  );
}
