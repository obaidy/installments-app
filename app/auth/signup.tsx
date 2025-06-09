import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StyledInput } from '../../components/form/StyledInput';
import { PrimaryButton } from '../../components/form/PrimaryButton';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { signUp, supabase } from '../../lib/supabaseClient';
import { Layout } from '../../constants/Layout';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [complexCode, setComplexCode] = useState('');
  const [error, setError] = useState('');

  async function handleSignup() {
    const { data, error, roleError } = await signUp(email, password);
    if (error || roleError) {
      setError(error?.message ?? roleError?.message ?? 'Unknown error');
      return;
    }
    const code = complexCode.trim();

    if (code && data.user) {
    const { error: insertError } = await supabase
      .from('clients')
      .insert({ user_id: data.user.id, complex_code: code });

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
      <StyledInput
         style={styles.input}
        placeholder="Complex Code"
        autoCapitalize="none"
        multiline
        onChangeText={setComplexCode}
        value={complexCode}
      />
      <PrimaryButton title="Create Account" onPress={handleSignup} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Layout.screenPadding, gap: Layout.elementGap, justifyContent: 'center' },
  input: {
    height: 40,
    borderWidth: 1,
    paddingHorizontal: 8,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  error: { color: 'red' },
});
