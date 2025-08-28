import { View, Text, TouchableOpacity } from 'react-native';
import { formatIQD } from '../lib/format';

export type Installment = {
  id: number;               // BIGINT -> number
  unit_id: number;          // BIGINT -> number
  amount_iqd: number;
  due_date: string;         // ISO date string
  type?: 'installment' | 'service_fee';
  paid?: boolean | null;    // optional (exists in DB)
  paid_at?: string | null;  // optional (exists in DB after our patch)
};

export default function InstallmentCard({
  item,
  onPay,
  onPromise,
}: {
  item: Installment;
  onPay?: (i: Installment) => void;
  onPromise?: (i: Installment) => void;
}) {
  const due = new Date(item.due_date);
  const today = new Date();

  const isPaid = (item.paid ?? false) || !!item.paid_at;
  const isOverdue = !isPaid && due < new Date(today.toDateString());
  const status: 'paid' | 'due' | 'overdue' = isPaid ? 'paid' : isOverdue ? 'overdue' : 'due';

  return (
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        gap: 8,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>{formatIQD(item.amount_iqd)}</Text>
        <StatusBadge status={status} />
      </View>
      <Text style={{ color: '#6B7280' }}>
        {item.type === 'service_fee' ? 'Service Fee' : 'Installment'}
      </Text>
      <Text style={{ color: '#6B7280' }}>Due: {due.toDateString()}</Text>
      {!isPaid && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => onPay?.(item)}
            style={{ flex: 1, backgroundColor: '#111827', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>Pay</Text>
          </TouchableOpacity>
          {isOverdue ? (
            <TouchableOpacity
              onPress={() => onPromise?.(item)}
              style={{ flex: 1, backgroundColor: '#374151', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ color: 'white', fontWeight: '700' }}>Promise</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}

function StatusBadge({ status }: { status: 'paid' | 'due' | 'overdue' }) {
  const bg = status === 'paid' ? '#DCFCE7' : status === 'overdue' ? '#FEE2E2' : '#E5E7EB';
  const fg = status === 'paid' ? '#166534' : status === 'overdue' ? '#991B1B' : '#374151';
  const label = status === 'paid' ? 'Paid' : status === 'overdue' ? 'Overdue' : 'Due';
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
      <Text style={{ color: fg, fontWeight: '600', fontSize: 12 }}>{label}</Text>
    </View>
  );
}
