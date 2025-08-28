import { View } from 'react-native';
import { StyledInput } from '../form/StyledInput';
import { AdminActionButton } from './AdminActionButton';

export type AdminToolbarProps = {
  query: string;
  setQuery: (q: string) => void;
  onSearch: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  right?: React.ReactNode;
};

export function AdminToolbar({ query, setQuery, onSearch, onPrev, onNext, right }: AdminToolbarProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <StyledInput
        placeholder="Search…"
        value={query}
        onChangeText={setQuery}
        style={{ flex: 1 }}
        variant="filled"
      />
      <AdminActionButton title="Search" onPress={onSearch} />
      {onPrev ? <AdminActionButton title="Prev" onPress={onPrev} /> : null}
      {onNext ? <AdminActionButton title="Next" onPress={onNext} /> : null}
      {right}
    </View>
  );
}

