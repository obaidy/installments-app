import { StatusChip } from '@/components/StatusChip';
import { formatIQD, type Status } from '@/lib/format';

type Row = { id: string; unit: string; dueDate: string; amount: number; status: Status };

export function MoneyTable({ rows, locale = 'en-IQ' }: { rows: Row[]; locale?: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className="text-left p-3">Unit</th>
            <th className="text-left p-3">Due Date</th>
            <th className="text-left p-3">Amount</th>
            <th className="text-left p-3">Status</th>
          </tr>
        </thead>
        <tbody className="bg-card">
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="p-3">{r.unit}</td>
              <td className="p-3">{new Date(r.dueDate).toLocaleDateString()}</td>
              <td className="p-3">{formatIQD(r.amount, locale)}</td>
              <td className="p-3"><StatusChip status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

