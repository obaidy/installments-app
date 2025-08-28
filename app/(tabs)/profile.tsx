import { View, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { signOut } from '../../lib/supabaseClient';
import { setAppLanguage } from '../../lib/i18n';

export default function ProfileScreen() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace('/auth/Login');
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Profile</ThemedText>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button title="العربية" onPress={() => setAppLanguage('ar')} />
        <Button title="English" onPress={() => setAppLanguage('en')} />
        <Button title="کوردی" onPress={() => setAppLanguage('ku')} />
      </View>
      <Button
        title="Join Complex"
        onPress={() => router.push('/complexes/add')}
      />
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