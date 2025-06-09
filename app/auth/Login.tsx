import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StyledInput } from '../../components/form/StyledInput';
import { PrimaryButton } from '../../components/form/PrimaryButton';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { signIn } from '../../lib/supabaseClient';
import { Layout } from '../../constants/Layout';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin() {
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Login</ThemedText>
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <StyledInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        onChangeText={setEmail}
        value={email}
      />
      <StyledInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />
      <PrimaryButton title="Sign In" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Layout.screenPadding, gap: Layout.elementGap, justifyContent: 'center' },
  input: {
    height: 40,
    borderWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  error: { color: 'red' },
});
