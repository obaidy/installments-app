import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useToast } from '../../components/Toast';
import { StyledInput } from '../../components/form/StyledInput';
import { PrimaryButton } from '../../components/form/PrimaryButton';
import { insertComplexesFromInput } from '../../lib/complexes';
import { ThemedText } from '../../components/ThemedText';
import { Layout } from '../../constants/Layout';

export default function AddComplexScreen() {
  const [codes, setCodes] = useState('');
  const toast = useToast();

  async function handleAdd() {
    const error = await insertComplexesFromInput(codes);

    if (error) {
      toast.show(error);
    } else {
      toast.show('Complex added!');
    }
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Join Complex</ThemedText>
      <StyledInput
        style={[styles.input, styles.multiline]}
        placeholder="Complex Code(s), comma separated"
        value={codes}
        multiline
        onChangeText={setCodes}
      />
     <PrimaryButton title="Add" onPress={handleAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Layout.screenPadding, gap: Layout.elementGap },
  input: {
    height: 40,
    borderWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  multiline: {
    height: 60,
  },
});
