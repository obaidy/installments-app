"use client";
import { useEffect, useMemo, useState } from 'react';
import { Shell } from '@/components/Shell';
import { supabase } from '@/lib/supabaseClient';

type Row = { id: number; provider?: string | null; provider_ref?: string | null; amount: number; status: string; paid_at?: string | null };

export default function ReconciliationPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<any | null>(null);

  useEffect(() => { fetchAll(); }, []);
  async function fetchAll() {
    const { data } = await supabase
      .from('payments')
      .select('id, amount, status, provider, provider_ref, paid_at')
      .order('paid_at', { ascending: false })
      .limit(1000);
    setRows((data as any[]) || []);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(r => (r.provider_ref || '').toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <Shell>
      <h1 className="text-2xl font-semibold mb-4">Reconciliation</h1>
      <div className="flex items-center gap-2 mb-3">
        <input className="rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Search by provider ref" value={query} onChange={e => setQuery(e.target.value)} />
        <div className="flex-1" />
        <form onSubmit={async (e) => {
          e.preventDefault();
          const file = (e.currentTarget.elements.namedItem('file') as HTMLInputElement)?.files?.[0];
          if (!file) return;
          setUploading(true);
          try {
            const api = process.env.NEXT_PUBLIC_API_URL as string;
            const fd = new FormData();
            fd.append('file', file);
            const r = await fetch(`${api}/reconcile/upload`, { method: 'POST', body: fd as any });
            const d = await r.json();
            setSummary(d.summary);
          } finally { setUploading(false); }
        }}>
          <input type="file" name="file" accept=".csv,text/csv" />
          <button disabled={uploading} className="ml-2 px-3 py-1.5 rounded-md border border-border">{uploading ? 'Uploading…' : 'Upload CSV'}</button>
        </form>
      </div>
      {summary ? (
        <div className="mb-4 text-sm">Matched: {summary.matched} • Missing: {summary.missing} • Mismatched: {summary.mismatched}</div>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40"><tr>
            <th className="p-2 text-left">Provider</th>
            <th className="p-2 text-left">Ref</th>
            <th className="p-2 text-left">Amount</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Paid At</th>
          </tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-2">{r.provider || '-'}</td>
                <td className="p-2">{r.provider_ref || '-'}</td>
                <td className="p-2">{r.amount}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">{r.paid_at ? new Date(r.paid_at).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
