"use client";
import { useEffect, useMemo, useState } from 'react';
import { Shell } from '@/components/Shell';
import { Toolbar } from '@/components/Toolbar';
import { DataTable, type Column } from '@/components/DataTable';
import { Modal } from '@/components/ui/modal';
import { supabase } from '@/lib/supabaseClient';

type UnitRow = { id: number; name: string; complex?: string; complex_id?: number };
type Complex = { id: number; name: string };

export default function UnitsPage() {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<UnitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [hasMore, setHasMore] = useState(false);
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [complexId, setComplexId] = useState<number | ''>('');
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => { fetchAll(page); }, [page]);

  async function fetchAll(p: number) {
    setLoading(true);
    const from = p * pageSize; const to = from + pageSize - 1;
    const [{ data: units }, { data: compl }] = await Promise.all([
      supabase.from('units').select('id, name, complex_id, complexes(name)').order('name').range(from, to),
      supabase.from('complexes').select('id, name').order('name'),
    ]);
    setRows(((units as any[]) || []).map(u => ({ id: u.id as number, name: u.name as string, complex_id: u.complex_id as number, complex: u.complexes?.name as string | undefined })));
    setComplexes((compl as any[]) as Complex[] || []);
    setHasMore((((units as any[]) || []).length) === pageSize);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(r => r.name.toLowerCase().includes(q) || (r.complex || '').toLowerCase().includes(q));
  }, [rows, query]);

  const columns: Column<UnitRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'complex', label: 'Complex' },
    {
      key: 'id',
      label: 'Actions',
      width: '200px',
      render: (r) => (
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => { setEditingId(r.id); setName(r.name); setComplexId(r.complex_id || ''); setOpen(true); }}>Edit</button>
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => removeUnit(r.id)}>Delete</button>
        </div>
      )
    },
  ];

  async function onSave() {
    if (!name.trim() || !complexId) { setOpen(false); return; }
    if (editingId) {
      await supabase.from('units').update({ name: name.trim(), complex_id: Number(complexId) }).eq('id', editingId);
    } else {
      const { data, error } = await supabase.from('units').insert({ name: name.trim(), complex_id: Number(complexId) }).select('id, complexes(name)').single();
      if (!error && data) {
        setRows(rs => [{ id: data.id as number, name: name.trim(), complex_id: Number(complexId), complex: complexes.find(c => c.id === Number(complexId))?.name }, ...rs]);
      }
    }
    setOpen(false); setEditingId(null);
    fetchAll();
  }

  async function removeUnit(id: number) {
    await supabase.from('units').delete().eq('id', id);
    setRows(rs => rs.filter(r => r.id !== id));
  }

  return (
    <Shell>
      <h1 className="text-2xl font-semibold mb-2">Units</h1>
      <Toolbar
        query={query}
        setQuery={setQuery}
        onSearch={() => {/* client-side filter */}}
        right={<button className="rounded-md bg-primary text-primaryForeground px-3 py-2 text-sm" onClick={() => { setEditingId(null); setName(''); setComplexId(''); setOpen(true); }}>Add Unit</button>}
      />
      <DataTable columns={columns} rows={filtered} />
      {loading ? <div className="mt-2 text-sm opacity-70">Loading…</div> : null}
      <div className="flex items-center justify-end gap-2 mt-3">
        <button className="px-3 py-1.5 rounded-md border border-border disabled:opacity-50" disabled={page===0} onClick={() => setPage(p => Math.max(0, p-1))}>Prev</button>
        <button className="px-3 py-1.5 rounded-md border border-border disabled:opacity-50" disabled={!hasMore} onClick={() => setPage(p => p+1)}>Next</button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'Edit Unit' : 'Add Unit'}>
        <div className="grid gap-2">
          <label className="text-sm">Name</label>
          <input className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="text-sm">Complex</label>
          <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={complexId} onChange={(e) => setComplexId(Number(e.target.value))}>
            <option value="">Select…</option>
            {complexes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="mt-3 flex justify-end">
          <button className="rounded-md bg-primary text-primaryForeground px-3 py-2 text-sm" onClick={onSave}>Save</button>
        </div>
      </Modal>
    </Shell>
  );
}
