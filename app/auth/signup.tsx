import { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { signUp, supabase } from '../../lib/supabaseClient';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [complexCodes, setComplexCodes] = useState('');
  const [error, setError] = useState('');

  async function handleSignup() {
    const { data, error, roleError } = await signUp(email, password);
    if (error || roleError) {
      setError(error?.message ?? roleError?.message ?? 'Unknown error');
      return;
    }
    const codes = complexCodes
    .split(/[,\n]+/)
    .map((c) => c.trim())
    .filter(Boolean);

  if (codes.length && data.user) {
    const inserts = codes.map((code) => ({
      user_id: data.user!.id,
      complex_code: code,
    }));
    const { error: insertError } = await supabase
      .from('clients')
      .insert(inserts);

    if (insertError) {
      setError(insertError.message);
      return;
    }
  }
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Sign Up</ThemedText>
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        onChangeText={setEmail}
        value={email}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Complex Code(s), comma separated"
        autoCapitalize="none"
        multiline
        onChangeText={setComplexCodes}
        value={complexCodes}
      />
      <Button title="Create Account" onPress={handleSignup} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, justifyContent: 'center' },
  input: {
    height: 40,
    borderWidth: 1,
    paddingHorizontal: 8,
    borderColor: '#ccc',
    borderRadius: 4,
  },
    multiline: {
    height: 60,
  },
  error: { color: 'red' },
});
