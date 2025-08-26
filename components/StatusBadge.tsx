import { View, Text } from 'react-native';


export default function StatusBadge({ status }: { status: 'paid'|'due'|'overdue' }) {
const bg = status === 'paid' ? '#DCFCE7' : status === 'overdue' ? '#FEE2E2' : '#E5E7EB';
const fg = status === 'paid' ? '#166534' : status === 'overdue' ? '#991B1B' : '#374151';
const label = status === 'paid' ? 'Paid' : status === 'overdue' ? 'Overdue' : 'Due';
return (
<View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
<Text style={{ color: fg, fontWeight: '600', fontSize: 12 }}>{label}</Text>
</View>
);
}