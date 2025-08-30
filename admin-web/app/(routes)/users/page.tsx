"use client";
import { useEffect, useMemo, useState } from 'react';
import { Shell } from '@/components/Shell';
import { Toolbar } from '@/components/Toolbar';
import { DataTable, type Column } from '@/components/DataTable';
import { supabase } from '@/lib/supabaseClient';
import { ExportButton } from '@/components/ExportButton';
import { useTheme } from '@/lib/theme';
import { formatApiError } from '@/lib/apiError';
import { t } from '@/lib/i18n';

type Role = 'admin' | 'manager' | 'client';
type Row = { id: string; role: Role; email?: string | null; name?: string | null };

export default function UsersPage() {
  const { locale } = useTheme();
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => { fetchPage(page); }, [page]);

  async function fetchPage(p: number) {
    setLoading(true);
    const from = p * pageSize;
    const to = from + pageSize - 1;
    const { data } = await supabase
      .from('user_roles')
      .select('user_id, role, profiles(email, full_name)')
      .order('role')
      .range(from, to);
    const list = ((data as any[]) || []).map(r => ({ id: r.user_id as string, role: r.role as Role, email: r.profiles?.email as string | undefined, name: r.profiles?.full_name as string | undefined }));
    setRows(list);
    setHasMore(list.length === pageSize);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(r => r.id.toLowerCase().includes(q) || r.role.toLowerCase().includes(q));
  }, [rows, query]);
  const selectedRows = useMemo(() => filtered.filter(r => selected[String(r.id)]), [filtered, selected]);

  const columns: Column<Row>[] = [
    { key: 'email', label: 'Email', render: (r) => r.email || r.id },
    { key: 'role', label: 'Role', width: '140px', render: (r) => <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-xs bg-muted/30">{r.role.toUpperCase()}</span> },
    {
      key: 'id',
      label: t(locale,'actions'),
      width: '260px',
      render: (r) => (
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => changeRole(r.id, nextRole(r.role))}>{t(locale,'edit')}</button>
          <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => removeUser(r.id)}>{t(locale,'delete')}</button>
        </div>
      )
    },
  ];

  async function changeRole(userId: string, role: Role) {
    await supabase.from('user_roles').upsert({ user_id: userId, role });
    setRows(rs => rs.map(r => r.id === userId ? { ...r, role } : r));
  }
  async function removeUser(userId: string) {
    await supabase.from('user_roles').delete().eq('user_id', userId);
    setRows(rs => rs.filter(r => r.id !== userId));
  }
  async function bulkMake(role: Role) {
    const ids = selectedRows.map(r => r.id);
    if (!ids.length) return;
    await supabase.from('user_roles').upsert(ids.map(id => ({ user_id: id, role })));
    setRows(rs => rs.map(r => ids.includes(r.id) ? { ...r, role } : r));
    setSelected({});
  }
  async function bulkRemove() {
    const ids = selectedRows.map(r => r.id);
    if (!ids.length) return;
    await supabase.from('user_roles').delete().in('user_id', ids);
    setRows(rs => rs.filter(r => !ids.includes(r.id)));
    setSelected({});
  }
  function nextRole(role: Role): Role {
    if (role === 'admin') return 'manager';
    if (role === 'manager') return 'client';
    return 'admin';
  }

  return (
    <Shell>
      <h1 className="text-2xl font-semibold mb-2">{t(locale,'usersTitle')}</h1>
      <Toolbar
        query={query}
        setQuery={setQuery}
        onSearch={() => { /* client-side filter */ }}
        right={<div className="flex items-center gap-2"><ExportButton filename="users.csv" columns={[
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role' },
        ]} rows={(selectedRows.length ? selectedRows : filtered) as any} />
        <button className="px-3 py-1.5 rounded-md border border-border disabled:opacity-50" disabled={selectedRows.length===0} onClick={() => bulkMake('manager')}>{t(locale,'edit')} ({selectedRows.length})</button>
        <button className="px-3 py-1.5 rounded-md border border-border disabled:opacity-50" disabled={selectedRows.length===0} onClick={bulkRemove}>{t(locale,'delete')} ({selectedRows.length})</button>
        <InviteButton onInvited={() => window.location.reload()} /></div>}
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
    </Shell>
  );
}

function InviteButton({ onInvited }: { onInvited: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('client');
  const [error, setError] = useState<string>('');
  const { locale } = useTheme();
  async function invite() {
    setError('');
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const r = await fetch(`/api/admin/users/invite`, { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ email, role }) });
      if (r.ok) { setOpen(false); onInvited(); return; }
      const d = await r.json().catch(() => ({}));
      setError(formatApiError(locale, d?.error || null));
    } catch (e: any) {
      setError('Network error');
    }
  }
  return (
    <>
      <button className="rounded-md bg-primary text-primaryForeground px-3 py-2 text-sm" onClick={() => setOpen(true)}>Invite</button>
      {open ? (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)}>
          <div className="absolute right-4 top-16 bg-card border border-border rounded-md p-4 w-[320px]" onClick={e => e.stopPropagation()}>
            <div className="text-sm font-semibold mb-2">Invite user</div>
            <div className="grid gap-2">
              {error ? <div className="text-sm text-red-600">{error}</div> : null}
              <input className="rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={role} onChange={e => setRole(e.target.value as Role)}>
                <option value="client">Client</option>
                <option value="manager">Manager</option>
                <option value="accountant">Accountant</option>
              </select>
              <div className="flex justify-end gap-2 mt-2">
                <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => setOpen(false)}>Cancel</button>
                <button className="px-3 py-1.5 rounded-md border border-border" onClick={invite}>Send Invite</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

