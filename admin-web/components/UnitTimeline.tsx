import { formatDate } from '@/lib/format';
type Item = { id: string; type: 'installment' | 'service'; label: string; date: string; amount: number; paid?: boolean };

export function UnitTimeline({ items, locale = 'ar-IQ' }: { items: Item[]; locale?: string }) {
  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
      <ul className="space-y-4">
        {items.map((i) => (
          <li key={i.id} className="relative">
            <div className="absolute -left-2 top-1.5 w-3 h-3 rounded-full bg-primary" />
            <div className="flex items-center justify-between">
              <div className="font-medium">{i.label}</div>
              <div className="text-sm opacity-70">{formatDate(i.date, locale)}</div>
            </div>
            <div className="text-sm opacity-80">
              {new Intl.NumberFormat(locale, { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(i.amount)}
              {i.paid ? ' • PAID' : ''}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

