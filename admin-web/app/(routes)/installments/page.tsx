"use client";
import { useEffect, useMemo, useState } from 'react';
import { Shell } from '@/components/Shell';
import { Toolbar } from '@/components/Toolbar';
import { DataTable, type Column } from '@/components/DataTable';
import { supabase } from '@/lib/supabaseClient';
import { formatIQD, formatDate } from '@/lib/format';

type Row = { id: number; unit: string; amount: number; dueDate: string; status: 'paid'|'due'|'overdue' };

export default function InstallmentsPage() {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<'all'|'paid'|'due'|'overdue'>('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => { fetchAll(page); }, [page]);

  async function fetchAll(p: number) {
    setLoading(true);
    const now = new Date();
    const from = p * pageSize; const to = from + pageSize - 1;
    const { data } = await supabase
      .from('installments')
      .select('id, amount_iqd, due_date, paid, units(name)')
      .order('due_date', { ascending: true })
      .range(from, to);
    const list = ((data as any[]) || []).map(r => {
      const d = new Date(r.due_date as string);
      const st: Row['status'] = r.paid ? 'paid' : (d < now ? 'overdue' : 'due');
      return { id: r.id as number, unit: (r.units?.name as string) || '-', amount: r.amount_iqd as number, dueDate: r.due_date as string, status: st };
    });
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

  const columns: Column<Row>[] = [
    { key: 'unit', label: 'Unit' },
    { key: 'dueDate', label: 'Due', render: (r) => formatDate(r.dueDate, 'en-IQ') },
    { key: 'amount', label: 'Amount', render: (r) => formatIQD(r.amount, 'en-IQ') },
    { key: 'status', label: 'Status', render: (r) => <span className={"px-2 py-0.5 rounded-full border text-xs "+(r.status==='paid'? 'bg-green-100 text-green-700 border-green-200' : r.status==='overdue' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200')}>{r.status.toUpperCase()}</span> },
    { key: 'id', label: 'Actions', width: '160px', render: (r) => (
      <div className="flex gap-2">
        {r.status !== 'paid' ? <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => markPaid(r.id)}>Mark Paid</button> : null}
      </div>
    )},
  ];

  async function markPaid(id: number) {
    await supabase.from('installments').update({ paid: true, paid_at: new Date().toISOString() }).eq('id', id);
    setRows(rs => rs.map(r => r.id === id ? { ...r, status: 'paid' } : r));
  }

  return (
    <Shell>
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Installments</h1>
        <div className="flex items-center gap-2">
          <button className={"px-3 py-1.5 rounded-md border border-border "+(status==='all'?'bg-muted/30':'')} onClick={() => setStatus('all')}>All</button>
          <button className={"px-3 py-1.5 rounded-md border border-border "+(status==='due'?'bg-muted/30':'')} onClick={() => setStatus('due')}>Due</button>
          <button className={"px-3 py-1.5 rounded-md border border-border "+(status==='overdue'?'bg-muted/30':'')} onClick={() => setStatus('overdue')}>Past Due</button>
          <button className={"px-3 py-1.5 rounded-md border border-border "+(status==='paid'?'bg-muted/30':'')} onClick={() => setStatus('paid')}>Paid</button>
        </div>
        <Toolbar query={query} setQuery={setQuery} onSearch={() => {/* client filter */}} />
        <DataTable columns={columns} rows={filtered} />
        <div className="flex items-center justify-end gap-2 mt-3">
          <button className="px-3 py-1.5 rounded-md border border-border disabled:opacity-50" disabled={page===0} onClick={() => setPage(p => Math.max(0, p-1))}>Prev</button>
          <button className="px-3 py-1.5 rounded-md border border-border disabled:opacity-50" disabled={!hasMore} onClick={() => setPage(p => p+1)}>Next</button>
        </div>
        {loading ? <div className="mt-2 text-sm opacity-70">Loading…</div> : null}
      </main>
    </Shell>
  );
}
