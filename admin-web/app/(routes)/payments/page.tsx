"use client";
import { useEffect, useMemo, useState } from 'react';
import { Shell } from '@/components/Shell';
import { Toolbar } from '@/components/Toolbar';
import { DataTable, type Column } from '@/components/DataTable';
import { supabase } from '@/lib/supabaseClient';
import { ExportButton } from '@/components/ExportButton';
import { formatIQD, formatDate } from '@/lib/format';

type Row = { id: number; unit: string; amount: number; status: 'paid'|'pending'|'failed'|'cancelled'; paidAt?: string | null };

export default function PaymentsPage() {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<'all'|'paid'|'pending'|'failed'|'cancelled'>('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => { fetchAll(page); }, [page]);

  async function fetchAll(p: number) {
    setLoading(true);
    const from = p * pageSize; const to = from + pageSize - 1;
    const { data } = await supabase
      .from('payments')
      .select('id, amount, status, paid_at, units(name)')
      .order('paid_at', { ascending: false })
      .range(from, to);
    const list = ((data as any[]) || []).map(p => ({ id: p.id as number, unit: p.units?.name || '-', amount: p.amount as number, status: p.status as Row['status'], paidAt: p.paid_at as string | null }));
    setRows(list);
    setHasMore(list.length === pageSize);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let arr = rows;
    if (status !== 'all') arr = arr.filter(r => r.status === status);
    if (q) arr = arr.filter(r => r.unit.toLowerCase().includes(q));
    return arr;
  }, [rows, query, status]);
  const selectedRows = useMemo(() => filtered.filter(r => selected[String(r.id)]), [filtered, selected]);

  const columns: Column<Row>[] = [
    { key: 'unit', label: 'Unit' },
    { key: 'amount', label: 'Amount', render: (r) => formatIQD(r.amount, 'en-IQ') },
    { key: 'status', label: 'Status', render: (r) => <span className={"px-2 py-0.5 rounded-full border text-xs "+(r.status==='paid'? 'bg-green-100 text-green-700 border-green-200' : r.status==='pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : r.status==='failed' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-200')}>{r.status.toUpperCase()}</span> },
    { key: 'paidAt', label: 'Paid At', render: (r) => r.paidAt ? formatDate(r.paidAt, 'en-IQ') : '-' },
  ];

  return (
    <Shell>
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Payments</h1>
        <div className="flex items-center gap-2">
          <button className={"px-3 py-1.5 rounded-md border border-border "+(status==='all'?'bg-muted/30':'')} onClick={() => setStatus('all')}>All</button>
          <button className={"px-3 py-1.5 rounded-md border border-border "+(status==='paid'?'bg-muted/30':'')} onClick={() => setStatus('paid')}>Paid</button>
          <button className={"px-3 py-1.5 rounded-md border border-border "+(status==='pending'?'bg-muted/30':'')} onClick={() => setStatus('pending')}>Pending</button>
          <button className={"px-3 py-1.5 rounded-md border border-border "+(status==='failed'?'bg-muted/30':'')} onClick={() => setStatus('failed')}>Failed</button>
          <button className={"px-3 py-1.5 rounded-md border border-border "+(status==='cancelled'?'bg-muted/30':'')} onClick={() => setStatus('cancelled')}>Cancelled</button>
        </div>
        <Toolbar
          query={query}
          setQuery={setQuery}
          onSearch={() => {/* client filter */}}
          right={<ExportButton filename="payments.csv" columns={[
            { key: 'unit', label: 'Unit' },
            { key: 'amount', label: 'Amount' },
            { key: 'status', label: 'Status' },
            { key: 'paidAt', label: 'Paid At' },
          ]} rows={selectedRows.length ? selectedRows : filtered} />}
        />
        <DataTable
          columns={columns}
          rows={filtered}
          selectable
          selected={selected}
          onToggleRow={(r) => setSelected(s => ({ ...s, [String(r.id)]: !s[String(r.id)] }))}
          onToggleAll={(checked) => {
            const next: Record<string, boolean> = {};
            if (checked) filtered.forEach(r => next[String(r.id)] = true);
            setSelected(next);
          }}
        />
        <div className="flex items-center justify-end gap-2 mt-3">
          <button className="px-3 py-1.5 rounded-md border border-border disabled:opacity-50" disabled={page===0} onClick={() => setPage(p => Math.max(0, p-1))}>Prev</button>
          <button className="px-3 py-1.5 rounded-md border border-border disabled:opacity-50" disabled={!hasMore} onClick={() => setPage(p => p+1)}>Next</button>
        </div>
        {loading ? <div className="mt-2 text-sm opacity-70">Loading…</div> : null}
      </main>
    </Shell>
  );
}
