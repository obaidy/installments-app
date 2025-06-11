import { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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
  const [complexes, setComplexes] = useState<{ code: string; name: string }[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase
      .from('complexes')
      .select('code, name')
      .then(({ data }) => {
        if (data) setComplexes(data);
      });
  }, []);


  async function handleSignup() {
    const codes = selectedCodes;

    if (codes.length === 0) {
      setError('Please select at least one complex.');
      return;
    }

     const { data, error: signupError, roleError } = await signUp(email, password);
     if (signupError || roleError) {
    setError(signupError?.message ?? roleError?.message ?? 'Unknown error');
      return;
    }
  

    if (data.user) {
      const { data: existing, error: complexError } = await supabase
      .from('complexes')
      .select('code')
      .in('code', codes);

    if (complexError) {
      setError(complexError.message);
      return;
    }

    const available = new Set(existing?.map((c) => c.code));
    const invalid = codes.filter((c) => !available.has(c));
    if (invalid.length > 0) {
      setError('Complex code does not exist');
      return;
    }
      const inserts = codes.map((code) => ({
        user_id: data.user.id,
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
     <Pressable
        style={styles.pickerToggle}
        onPress={() => setPickerOpen((o) => !o)}
      >
        <ThemedText>
          {selectedCodes.length > 0
            ? `Selected: ${complexes
                .filter((c) => selectedCodes.includes(c.code))
                .map((c) => c.name)
                .join(', ')}`
            : 'Select Complexes'}
        </ThemedText>
      </Pressable>
      {pickerOpen && (
  <ScrollView style={styles.pickerContainer}>
    {complexes.map((c) => (
      <Pressable
        key={c.code}
        style={styles.pickerItem}
        onPress={() =>
          setSelectedCodes((codes) =>
            codes.includes(c.code)
              ? codes.filter((cc) => cc !== c.code)
              : [...codes, c.code],
          )
        }
      >
        <MaterialIcons
          name={
            selectedCodes.includes(c.code)
              ? 'check-box'
              : 'check-box-outline-blank'
          }
          size={24}
        />
        <ThemedText style={styles.pickerLabel}>{c.name}</ThemedText>
      </Pressable>
    ))}
  </ScrollView>
)}
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
  pickerToggle: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
  },
  pickerContainer: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: Layout.elementGap,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  pickerLabel: {
    marginLeft: 8,
  },
});
