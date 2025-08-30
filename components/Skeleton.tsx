import { View } from 'react-native';

export function Skeleton({ height = 16, width = '100%', radius = 6 }: { height?: number; width?: number | string; radius?: number }) {
  return (
    <View style={{ height, width, borderRadius: radius, backgroundColor: '#E5E7EB' }} />
  );
}

export function SkeletonList({ rows = 6 }: { rows?: number }) {
  return (
    <View style={{ gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ gap: 8 }}>
          <Skeleton height={18} width="60%" />
          <Skeleton height={14} width="40%" />
        </View>
      ))}
    </View>
  );
}

