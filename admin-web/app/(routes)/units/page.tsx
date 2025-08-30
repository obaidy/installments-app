"use client";
import { useEffect, useMemo, useState } from 'react';
import { Shell } from '@/components/Shell';
import { Toolbar } from '@/components/Toolbar';
import { DataTable, type Column } from '@/components/DataTable';
import { Modal } from '@/components/ui/modal';
import { supabase } from '@/lib/supabaseClient';
import { ExportButton } from '@/components/ExportButton';
import { useTheme } from '@/lib/theme';
import { t } from '@/lib/i18n';

type UnitRow = { id: number; name: string; complex?: string; complex_id?: number; user_id?: string | null; owner?: string | null; autopay?: boolean };
type Complex = { id: number; name: string };
type Client = { id: string; email?: string | null; name?: string | null };

export default function UnitsPage() {
  const { locale } = useTheme();
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
  const [clients, setClients] = useState<Client[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUnitId, setAssignUnitId] = useState<number | null>(null);
  const [assignUserId, setAssignUserId] = useState<string>('');
  const [cardsOpen, setCardsOpen] = useState(false);
  const [cards, setCards] = useState<any[]>([]);
  const [cardsUnitId, setCardsUnitId] = useState<number | null>(null);

  useEffect(() => { fetchAll(page); }, [page]);

  async function fetchAll(p: number) {
    setLoading(true);
    const from = p * pageSize; const to = from + pageSize - 1;
    const [{ data: units }, { data: compl }, { data: clientRows }] = await Promise.all([
      supabase.from('units').select('id, name, complex_id, user_id, autopay_enabled, complexes(name), profiles(email)').order('name').range(from, to),
      supabase.from('complexes').select('id, name').order('name'),
      supabase.from('user_roles').select('user_id, role, profiles(email, full_name)').eq('role','client').order('profiles(email)')
    ]);
    setRows(((units as any[]) || []).map(u => ({ id: u.id as number, name: u.name as string, complex_id: u.complex_id as number, complex: u.complexes?.name as string | undefined, user_id: (u.user_id as string|undefined)|| null, owner: (u.profiles?.email as string|undefined)|| null, autopay: !!u.autopay_enabled })));
    setComplexes((compl as any[]) as Complex[] || []);
    setClients(((clientRows as any[]) || []).map(r => ({ id: r.user_id as string, email: r.profiles?.email as string | undefined, name: r.profiles?.full_name as string | undefined })) as Client[]);
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
    { key: 'name', label: t(locale,'name') },
    { key: 'complex', label: t(locale,'complex') },
    { key: 'owner', label: t(locale,'owner'), render: (r) => r.owner || '-' },
    { key: 'autopay', label: 'Autopay', width: '140px', render: (r) => (
      <label className="inline-flex items-center gap-2">
        <input type="checkbox" checked={!!r.autopay} onChange={async (e) => {
          await supabase.from('units').update({ autopay_enabled: e.currentTarget.checked }).eq('id', r.id);
          setRows(rs => rs.map(x => x.id === r.id ? { ...x, autopay: e.currentTarget.checked } : x));
        }} />
        <span className="text-xs opacity-70">{r.autopay ? 'On' : 'Off'}</span>
      </label>
    ) },
    {
      key: 'id',
      label: t(locale,'actions'),
      width: '260px',
      render: (r) => (
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => { setEditingId(r.id); setName(r.name); setComplexId(r.complex_id || ''); setOpen(true); }}>{t(locale,'edit')}</button>
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => { setAssignUnitId(r.id); setAssignUserId(r.user_id || ''); setAssignOpen(true); }}>{r.user_id ? t(locale,'changeOwner') : t(locale,'assignOwner')}</button>
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={async () => {
            try {
              const api = process.env.NEXT_PUBLIC_API_URL as string;
              const { data: { session } } = await supabase.auth.getSession();
              const token = session?.access_token;
              const r2 = await fetch(`${api}/payments/charge-now`, { method: 'POST', headers: { 'content-type':'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ unit_id: r.id }) });
              if (r2.ok) alert('Charge created'); else alert('Charge failed');
            } catch { alert('Network error'); }
          }}>Charge</button>
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={async () => {
            setCardsOpen(true); setCardsUnitId(r.id); setCards([]);
            try {
              const api = process.env.NEXT_PUBLIC_API_URL as string;
              const { data: { session } } = await supabase.auth.getSession();
              const token = session?.access_token;
              const resp = await fetch(`${api}/payments/pm/list?unit_id=${r.id}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
              const d = await resp.json();
              setCards((d?.paymentMethods || []) as any[]);
            } catch {}
          }}>Cards</button>
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => removeUnit(r.id)}>{t(locale,'delete')}</button>
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
      <h1 className="text-2xl font-semibold mb-2">{t(locale,'unitsTitle')}</h1>
      <Toolbar
        query={query}
        setQuery={setQuery}
        onSearch={() => {/* client-side filter */}}
        placeholder={t(locale,'searchPlaceholder')}
        right={<div className="flex items-center gap-2">
          <ExportButton filename="units.csv" columns={[
            { key: 'name', label: t(locale,'name') },
            { key: 'complex', label: t(locale,'complex') },
            { key: 'owner', label: t(locale,'owner') },
          ]} rows={(selectedRows.length ? selectedRows : filtered) as any} />
          <button className="px-3 py-1.5 rounded-md border border-border disabled:opacity-50" disabled={selectedRows.length===0} onClick={bulkRemove}>{t(locale,'deleteSelected')} ({selectedRows.length})</button>
          <button className="rounded-md bg-primary text-primaryForeground px-3 py-2 text-sm" onClick={() => { setEditingId(null); setName(''); setComplexId(''); setOpen(true); }}>{t(locale,'addUnit')}</button>
        </div>}
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
      {loading ? <div className="mt-2 text-sm opacity-70">{t(locale,'loading')}</div> : null}
      <div className="flex items-center justify-end gap-2 mt-3">
        <button className="px-3 py-1.5 rounded-md border border-border disabled:opacity-50" disabled={page===0} onClick={() => setPage(p => Math.max(0, p-1))}>{t(locale,'prev')}</button>
        <button className="px-3 py-1.5 rounded-md border border-border disabled:opacity-50" disabled={!hasMore} onClick={() => setPage(p => p+1)}>{t(locale,'next')}</button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? t(locale,'edit') + ' ' + t(locale,'units') : t(locale,'addUnit')}>
        <div className="grid gap-2">
          <label className="text-sm">{t(locale,'name')}</label>
          <input className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="text-sm">{t(locale,'complex')}</label>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={complexId}
            onChange={(e) => {
              const v = e.target.value;
              setComplexId(v ? Number(v) : '');
            }}
          >
            <option value="">{t(locale,'select')}</option>
            {complexes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {/* Owner is assigned after creation via the Assign Owner action */}
          {formError ? <div className="text-red-600 text-sm mt-1">{formError}</div> : null}
        </div>
        <div className="mt-3 flex justify-end">
          <button className="rounded-md bg-primary text-primaryForeground px-3 py-2 text-sm" onClick={onSave}>{t(locale,'save')}</button>
        </div>
      </Modal>
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title={t(locale,'assignOwner')}>
        <div className="grid gap-2">
          <label className="text-sm">{t(locale,'client')}</label>
          <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)}>
            <option value="">{t(locale,'select')}</option>
            {clients.map(u => (
              <option key={u.id} value={u.id}>{u.email || u.name || u.id}</option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex justify-between">
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={async () => {
            if (!assignUnitId) return;
            await supabase.from('units').update({ user_id: null }).eq('id', assignUnitId);
            setRows(rs => rs.map(r => r.id === assignUnitId ? { ...r, user_id: null, owner: null } : r));
            setAssignOpen(false);
          }}>{t(locale,'unassign')}</button>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => setAssignOpen(false)}>{t(locale,'cancel')}</button>
            <button className="px-3 py-1.5 rounded-md border border-border" onClick={async () => {
              if (!assignUnitId || !assignUserId) return;
              await supabase.from('units').update({ user_id: assignUserId }).eq('id', assignUnitId);
              const u = clients.find(c => c.id === assignUserId);
              setRows(rs => rs.map(r => r.id === assignUnitId ? { ...r, user_id: assignUserId, owner: u?.email || u?.name || assignUserId } : r));
              setAssignOpen(false);
            }}>{t(locale,'save')}</button>
          </div>
        </div>
      </Modal>
      <Modal open={cardsOpen} onClose={() => setCardsOpen(false)} title={`Cards for Unit ${cardsUnitId ?? ''}`}>
        <div className="grid gap-2">
          {cards.length === 0 ? <div className="text-sm opacity-70">No cards</div> : (
            <ul className="space-y-2">
              {cards.map((pm: any) => (
                <li key={pm.id} className="text-sm">
                  {(pm.card?.brand || '') + ' •••• ' + (pm.card?.last4 || '') + '  ' + pm.card?.exp_month + '/' + pm.card?.exp_year}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </Shell>
  );
}
