"use client";
import { useEffect, useMemo, useState } from 'react';
import { Shell } from '@/components/Shell';
import { Toolbar } from '@/components/Toolbar';
import { DataTable, type Column } from '@/components/DataTable';
import { Modal } from '@/components/ui/modal';
import { supabase } from '@/lib/supabaseClient';
import { ExportButton } from '@/components/ExportButton';

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
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState<string>('');

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
  const selectedRows = useMemo(() => filtered.filter(r => selected[String(r.id)]), [filtered, selected]);

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
    setFormError('');
    const cid = typeof complexId === 'number' ? complexId : (complexId ? Number(complexId) : NaN);
    if (!name.trim() || !cid || Number.isNaN(cid)) { setFormError('Please enter a name and select a complex.'); return; }
    try {
      if (editingId) {
        const { error } = await supabase.from('units').update({ name: name.trim(), complex_id: cid }).eq('id', editingId);
        if (error) throw error;
        await fetchAll(page);
      } else {
        const { data, error } = await supabase.from('units').insert({ name: name.trim(), complex_id: cid }).select('id').single();
        if (error) throw error;
        if (data) {
          setRows(rs => [{ id: data.id as number, name: name.trim(), complex_id: cid, complex: complexes.find(c => c.id === cid)?.name }, ...rs]);
        }
      }
      setOpen(false); setEditingId(null);
    } catch (e: any) {
      setFormError(e?.message || 'Failed to save unit');
    }
  }

  async function removeUnit(id: number) {
    await supabase.from('units').delete().eq('id', id);
    setRows(rs => rs.filter(r => r.id !== id));
  }

  async function bulkRemove() {
    const ids = selectedRows.map(r => r.id);
    if (!ids.length) return;
    await supabase.from('units').delete().in('id', ids);
    setRows(rs => rs.filter(r => !ids.includes(r.id)));
    setSelected({});
  }

  return (
    <Shell>
      <h1 className="text-2xl font-semibold mb-2">Units</h1>
      <Toolbar
        query={query}
        setQuery={setQuery}
        onSearch={() => {/* client-side filter */}}
        right={<div className="flex items-center gap-2"><ExportButton filename="units.csv" columns={[
          { key: 'name', label: 'Name' },
          { key: 'complex', label: 'Complex' },
        ]} rows={(selectedRows.length ? selectedRows : filtered) as any} />
        <button className="px-3 py-1.5 rounded-md border border-border disabled:opacity-50" disabled={selectedRows.length===0} onClick={bulkRemove}>Delete Selected ({selectedRows.length})</button>
        <button className="rounded-md bg-primary text-primaryForeground px-3 py-2 text-sm" onClick={() => { setEditingId(null); setName(''); setComplexId(''); setOpen(true); }}>Add Unit</button></div>}
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
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={complexId}
            onChange={(e) => {
              const v = e.target.value;
              setComplexId(v ? Number(v) : '');
            }}
          >
            <option value="">Select…</option>
            {complexes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {formError ? <div className="text-red-600 text-sm mt-1">{formError}</div> : null}
        </div>
        <div className="mt-3 flex justify-end">
          <button className="rounded-md bg-primary text-primaryForeground px-3 py-2 text-sm" onClick={onSave}>Save</button>
        </div>
      </Modal>
    </Shell>
  );
}

