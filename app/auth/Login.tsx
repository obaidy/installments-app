import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { StyledInput } from '../../components/form/StyledInput';
import { PrimaryButton } from '../../components/form/PrimaryButton';
import { ThemedView } from '../../components/ThemedView';
import { signIn, getCurrentUserRole } from '../../lib/supabaseClient';
import { DesignTokens } from '../../constants/design';

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
    
    const role = await getCurrentUserRole();
    if (!role) {
      setError('Unable to determine user role');
      return;
    }

    console.log('[Login] role:', role);
    if (role === 'admin') {
      console.log('[Login] redirecting to /(web)');
      router.replace('/(web)');
    } else if (role === 'manager') {
      console.log('[Login] redirecting to /(manager)');
      router.replace('/(manager)');
    } else {
      console.log('[Login] redirecting to /(tabs)');
      router.replace('/(tabs)');
    }
  }

  return (
    <ThemedView
      style={styles.container}
      lightColor={DesignTokens.colors.light.background}
      darkColor={DesignTokens.colors.dark.background}
    >
      {/* <Image
        source={require('../../assets/images/react-logo.png')}
        style={styles.logo}
      /> */}
      <ThemedText type="title">Login</ThemedText>
        {error ? (
        <ThemedText
          style={styles.error}
          lightColor={DesignTokens.colors.light.error}
          darkColor={DesignTokens.colors.dark.error}
        >
          {error}
        </ThemedText>
      ) : null}
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
      <Pressable onPress={() => router.push('/auth/signup')}>
        <ThemedText type="link">Create an account</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing.screen,
    gap: DesignTokens.spacing.element,
  },
  logo: {
    width: DesignTokens.sizes.logo,
    height: DesignTokens.sizes.logo,
    marginBottom: DesignTokens.spacing.element,
  },
  input: {
    alignSelf: 'stretch',
  },
  error: {
    ...DesignTokens.typography.error,
  },
});
