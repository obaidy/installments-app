import { Text, View } from 'react-native';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export function AdminStatusChip({ label, variant = 'default' }: { label: string; variant?: Variant }) {
  const styles = getStyles(variant);
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

function getStyles(variant: Variant) {
  const base = {
    container: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
    },
    text: {
      fontSize: 12,
      fontWeight: '600' as const,
    },
  };

  switch (variant) {
    case 'success':
      return {
        container: { ...base.container, backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
        text: { ...base.text, color: '#166534' },
      };
    case 'warning':
      return {
        container: { ...base.container, backgroundColor: '#FEF9C3', borderColor: '#FDE68A' },
        text: { ...base.text, color: '#854D0E' },
      };
    case 'danger':
      return {
        container: { ...base.container, backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
        text: { ...base.text, color: '#991B1B' },
      };
    case 'info':
      return {
        container: { ...base.container, backgroundColor: '#E0E7FF', borderColor: '#C7D2FE' },
        text: { ...base.text, color: '#3730A3' },
      };
    default:
      return {
        container: { ...base.container, backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
        text: { ...base.text, color: '#111827' },
      };
  }
}

