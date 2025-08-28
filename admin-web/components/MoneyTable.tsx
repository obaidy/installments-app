"use client";
import { useMemo, useState } from 'react';
import { StatusChip } from '../components/StatusChip';
import { formatIQD, formatDate, type Status } from '@/lib/format';

type Row = { id: string; unit: string; dueDate: string; amount: number; status: Status };

export function MoneyTable({ rows, locale = 'ar-IQ' }: { rows: Row[]; locale?: string }) {
  const [sortBy, setSortBy] = useState<'unit' | 'dueDate' | 'amount' | 'status'>('dueDate');
  const [dir, setDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let av: any = a[sortBy];
      let bv: any = b[sortBy];
      if (sortBy === 'dueDate') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      if (sortBy === 'amount') { av = a.amount; bv = b.amount; }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sortBy, dir]);

  function click(col: 'unit' | 'dueDate' | 'amount' | 'status') {
    if (sortBy === col) setDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setDir('asc'); }
  }

  function Arrow({ active, dir }: { active: boolean; dir: 'asc'|'desc' }) {
    return <span className="ml-1 text-xs opacity-70">{active ? (dir==='asc' ? '↑' : '↓') : '↕'}</span>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/40 sticky top-0 z-10 backdrop-blur">
          <tr>
            <th className="text-left p-3 cursor-pointer select-none" onClick={() => click('unit')}>Unit<Arrow active={sortBy==='unit'} dir={dir} /></th>
            <th className="text-left p-3 cursor-pointer select-none" onClick={() => click('dueDate')}>Due Date<Arrow active={sortBy==='dueDate'} dir={dir} /></th>
            <th className="text-left p-3 cursor-pointer select-none" onClick={() => click('amount')}>Amount<Arrow active={sortBy==='amount'} dir={dir} /></th>
            <th className="text-left p-3 cursor-pointer select-none" onClick={() => click('status')}>Status<Arrow active={sortBy==='status'} dir={dir} /></th>
          </tr>
        </thead>
        <tbody className="bg-card">
          {sorted.map((r, i) => (
            <tr key={r.id} className={"border-t border-border transition-colors "+(i%2===1?"bg-muted/10":"")+" hover:bg-muted/20"}>
              <td className="p-3">{r.unit}</td>
              <td className="p-3">{formatDate(r.dueDate, locale)}</td>
              <td className="p-3">{formatIQD(r.amount, locale)}</td>
              <td className="p-3"><StatusChip status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

