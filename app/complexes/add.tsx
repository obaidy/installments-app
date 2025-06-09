import { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabaseClient';
import { ThemedText } from '@/components/ThemedText';

export default function AddComplexScreen() {
  const [codes, setCodes] = useState('');

  async function handleAdd() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Please login first.');
      return;
    }

    const codeList = codes
      .split(/[\n,]+/)
      .map((c) => c.trim())
      .filter(Boolean);

    if (codeList.length === 0) {
      Alert.alert('Please enter at least one code.');
      return;
    }

    const inserts = codeList.map((code) => ({
      user_id: user.id,
      complex_code: code,
    }));

    const { error } = await supabase.from('clients').insert(inserts);

    if (error) Alert.alert(error.message);
    else Alert.alert('Complex added!');
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Join Complex</ThemedText>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Complex Code(s), comma separated"
        value={codes}
        multiline
        onChangeText={setCodes}
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
  multiline: {
    height: 60,
  },
});
