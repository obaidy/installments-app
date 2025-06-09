import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';

export default function PaymentsHomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.item}
        onPress={() => router.push('/payments/history')}
      >
        <ThemedText>Payment History</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.item}
        onPress={() => router.push('/payments/upcoming')}
      >
        <ThemedText>Upcoming Installments</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  item: { padding: 12, backgroundColor: '#fff', borderRadius: 4 },
});
