import { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { supabase } from '@/lib/supabaseClient';
import { ThemedText } from '@/components/ThemedText';

export default function AddComplexScreen() {
  const [code, setCode] = useState('');

  async function handleAdd() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Please login first.');
      return;
    }

    const { error } = await supabase
      .from('clients')
      .insert({ user_id: user.id, complex_code: code });

    if (error) Alert.alert(error.message);
    else Alert.alert('Complex added!');
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Join Complex</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Complex Code"
        value={code}
        onChangeText={setCode}
      />
      <Button title="Add" onPress={handleAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  input: {
    height: 40,
    borderWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderColor: '#ccc',
  },
});
