import { View, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { signOut } from '../../lib/supabaseClient';

export default function ProfileScreen() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace('/auth/Login');
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Profile</ThemedText>
      <Button title="Sign Out" onPress={handleSignOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
});