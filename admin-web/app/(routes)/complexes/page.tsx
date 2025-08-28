"use client";
import { useEffect, useMemo, useState } from 'react';
import { Shell } from '@/components/Shell';
import { Toolbar } from '@/components/Toolbar';
import { DataTable, type Column } from '@/components/DataTable';
import { Modal } from '@/components/ui/modal';
import { supabase } from '@/lib/supabaseClient';

type Complex = { id: number; name: string; code?: string | null; units?: number };

export default function ComplexesPage() {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<Complex[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [hasMore, setHasMore] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempName, setTempName] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => { fetchAll(page); }, [page]);

  async function fetchAll(p: number) {
    setLoading(true);
    const from = p * pageSize; const to = from + pageSize - 1;
    const { data: complexes } = await supabase.from('complexes').select('id, name, code').order('name').range(from, to);
    const base = ((complexes as any[]) || []).map(c => ({ id: c.id as number, name: c.name as string, code: (c.code as string) ?? null })) as Complex[];
    // Fetch units counts (grouped)
    const { data: units } = await supabase.from('units').select('complex_id').limit(10000);
    const counts = new Map<number, number>();
    ((units as any[]) || []).forEach(u => counts.set(u.complex_id as number, (counts.get(u.complex_id as number) || 0) + 1));
    base.forEach(c => { c.units = counts.get(c.id) || 0; });
    setRows(base);
    setHasMore(base.length === pageSize);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(r => r.name.toLowerCase().includes(q) || (r.code || '').toLowerCase().includes(q));
  }, [rows, query]);

  const columns: Column<Complex>[] = [
    { key: 'name', label: 'Name', render: (r) => (
      editingId === r.id ? (
        <span className="inline-flex items-center gap-2">
          <span>🏢</span>
          <input autoFocus className="rounded-md border border-input bg-background px-2 py-1 text-sm" value={tempName} onChange={(e) => setTempName(e.target.value)} />
          <button className="px-2 py-1 text-sm rounded-md border border-border" onClick={async () => {
            if (!tempName.trim()) return;
            await supabase.from('complexes').update({ name: tempName.trim() }).eq('id', r.id);
            setRows(rs => rs.map(x => x.id === r.id ? { ...x, name: tempName.trim() } : x));
            setEditingId(null);
          }}>Save</button>
          <button className="px-2 py-1 text-sm rounded-md border border-border" onClick={() => setEditingId(null)}>Cancel</button>
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          <span>🏢</span>
          <span>{r.name}</span>
          <button className="px-2 py-0.5 text-xs rounded-md border border-border" onClick={() => { setEditingId(r.id); setTempName(r.name); }}>Edit</button>
        </span>
      )
    ) },
    { key: 'code', label: 'Code', render: (r) => <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs bg-muted/30">{r.code || '-'}</span> },
    { key: 'units', label: 'Units', width: '120px', render: (r) => <span className="opacity-80">{r.units ?? 0} units</span> },
    {
      key: 'id',
      label: 'Actions',
      width: '200px',
      render: (r) => (
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => { setName(r.name); setCode(r.code || ''); setOpen(true); setEditingId(r.id); }}>Edit</button>
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => setConfirmId(r.id)}>Delete</button>
        </div>
      )
    },
  ]

  async function onSaveModal() {
    if (!name.trim()) { setOpen(false); return; }
    if (editingId) {
      await supabase.from('complexes').update({ name: name.trim(), code: code.trim() || null }).eq('id', editingId);
      setRows(rs => rs.map(x => x.id === editingId ? { ...x, name: name.trim(), code: code.trim() || null } : x));
    } else {
      const { data, error } = await supabase.from('complexes').insert({ name: name.trim(), code: code.trim() || null }).select('id').single();
      if (!error && data) setRows(rs => [{ id: data.id as number, name: name.trim(), code: code.trim() || null, units: 0 }, ...rs]);
    }
    setOpen(false); setEditingId(null);
  }

  async function onConfirmDelete() {
    if (!confirmId) return;
    await supabase.from('complexes').delete().eq('id', confirmId);
    setRows(rs => rs.filter(x => x.id !== confirmId));
    setConfirmId(null);
  }

  return (
    <Shell>
      <h1 className="text-2xl font-semibold mb-2">Complexes</h1>
      <Toolbar
        query={query}
        setQuery={setQuery}
        onSearch={() => {/* client filter */}}
        right={<button className="rounded-md bg-primary text-primaryForeground px-3 py-2 text-sm" onClick={() => { setName(''); setCode(''); setOpen(true); setEditingId(null); }}>Add Complex</button>}
      />
      <DataTable columns={columns} rows={filtered} />
      {loading ? <div className="mt-2 text-sm opacity-70">Loading…</div> : null}
      <div className="flex items-center justify-end gap-2 mt-3">
        <button className="px-3 py-1.5 rounded-md border border-border disabled:opacity-50" disabled={page===0} onClick={() => setPage(p => Math.max(0, p-1))}>Prev</button>
        <button className="px-3 py-1.5 rounded-md border border-border disabled:opacity-50" disabled={!hasMore} onClick={() => setPage(p => p+1)}>Next</button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'Edit Complex' : 'Add Complex'}>
        <div className="grid gap-2">
          <label className="text-sm">Name</label>
          <input className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="text-sm">Code</label>
          <input className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div className="mt-3 flex justify-end">
          <button className="rounded-md bg-primary text-primaryForeground px-3 py-2 text-sm" onClick={onSaveModal}>Save</button>
        </div>
      </Modal>

      <Modal open={confirmId !== null} onClose={() => setConfirmId(null)} title="Confirm Delete">
        <div>Are you sure you want to delete this complex?</div>
        <div className="mt-3 flex justify-end gap-2">
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => setConfirmId(null)}>Cancel</button>
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={onConfirmDelete}>Delete</button>
        </div>
      </Modal>
    </Shell>
  );
}
