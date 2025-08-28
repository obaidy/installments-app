import { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyledInput } from '../../components/form/StyledInput';
import { PrimaryButton } from '../../components/form/PrimaryButton';
import { useRouter } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { signUp, supabase } from '../../lib/supabaseClient';
import { Layout } from '../../constants/Layout';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [complexes, setComplexes] = useState<{ id: number; name: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase
      .from('complexes')
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        if (data) setComplexes(data as any);
      });
  }, []);


  async function handleSignup() {
    const ids = selectedIds;
  
    if (ids.length === 0) {
      setError('Please select at least one complex.');
      return;
    }
  
    const { data, error: signupError, roleError } = await signUp(email, password);
    if (signupError || roleError) {
      setError(signupError?.message ?? roleError?.message ?? 'Unknown error');
      return;
    }
  
    const userId = data.user?.id;
  
    if (userId) {
      for (const complexId of ids) {
        const { error: linkError } = await supabase
          .from('user_complexes')
          .insert({ user_id: userId, complex_id: complexId });
        if (linkError) {
          setError(linkError.message);
          return;
        }
      }
    }
  
    router.replace('/dashboard');
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
          {selectedIds.length > 0
            ? `Selected: ${complexes
                .filter((c) => selectedIds.includes(c.id))
                .map((c) => c.name)
                .join(', ')}`
            : 'Select Complexes'}
        </ThemedText>
      </Pressable>
      {pickerOpen && (
  <ScrollView style={styles.pickerContainer}>
    {complexes.map((c) => (
      <Pressable
        key={c.id}
        style={styles.pickerItem}
        onPress={() =>
          setSelectedIds((ids) =>
            ids.includes(c.id)
              ? ids.filter((id) => id !== c.id)
              : [...ids, c.id],
          )
        }
      >
        <MaterialIcons
          name={
            selectedIds.includes(c.id)
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
