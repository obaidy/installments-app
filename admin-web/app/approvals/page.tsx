"use client";
import { useEffect, useState } from 'react';
import { Shell } from '@/components/Shell';
import { supabase } from '@/lib/supabaseClient';

export default function ApprovalsPage() {
  const [usersPending, setUsersPending] = useState<any[]>([]);
  const [clientsPending, setClientsPending] = useState<any[]>([]);
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const u = await supabase.auth.getUser();
      setMe(u.data.user?.id || null);
      const { data: up } = await supabase.from('user_status').select('user_id, status').eq('status','pending');
      setUsersPending((up as any[]) || []);
      const { data: cp } = await supabase.from('client_complex_status').select('user_id, complex_id, status, complexes(name)').eq('status','pending');
      setClientsPending((cp as any[]) || []);
    })();
  }, []);

  async function approveUser(userId: string, role: 'client'|'manager'|'accountant'|'admin' = 'client') {
    const approved_by = me;
    await supabase.from('user_status').upsert({ user_id: userId, status: 'approved', approved_by, approved_at: new Date().toISOString() });
    await supabase.from('user_roles').upsert({ user_id: userId, role });
    await supabase.from('audit_log').insert({ actor: me, action: 'approve_user', entity: 'auth.users', entity_id: userId, meta: { role } });
    setUsersPending(rs => rs.filter((r: any) => r.user_id !== userId));
  }

  async function approveClient(userId: string, complexId: number) {
    const approved_by = me;
    await supabase.from('client_complex_status').upsert({ user_id: userId, complex_id: complexId, status: 'approved', approved_by, approved_at: new Date().toISOString() });
    await supabase.from('audit_log').insert({ actor: me, action: 'approve_client', entity: 'client_complex_status', entity_id: `${userId}:${complexId}` });
    setClientsPending(rs => rs.filter((r: any) => !(r.user_id === userId && r.complex_id === complexId)));
  }

  return (
    <Shell>
      <h1 className="text-2xl font-semibold mb-4">Approvals</h1>
      <section className="space-y-2 mb-8">
        <h2 className="text-lg font-semibold">Users</h2>
        {usersPending.length === 0 ? <div className="text-sm opacity-70">No pending users</div> : null}
        <ul className="space-y-2">
          {usersPending.map((u: any) => (
            <li key={u.user_id} className="flex items-center justify-between border border-border rounded-md px-3 py-2">
              <div>
                <div className="text-sm">{u.user_id}</div>
                <div className="text-xs opacity-70">status: {u.status}</div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => approveUser(u.user_id, 'client')}>Approve Client</button>
                <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => approveUser(u.user_id, 'manager')}>Approve Manager</button>
                <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => approveUser(u.user_id, 'accountant')}>Approve Accountant</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Clients per Complex</h2>
        {clientsPending.length === 0 ? <div className="text-sm opacity-70">No pending client-complex approvals</div> : null}
        <ul className="space-y-2">
          {clientsPending.map((c: any) => (
            <li key={`${c.user_id}:${c.complex_id}`} className="flex items-center justify-between border border-border rounded-md px-3 py-2">
              <div>
                <div className="text-sm">{c.user_id}</div>
                <div className="text-xs opacity-70">complex: {c.complexes?.name || c.complex_id} • status: {c.status}</div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-md border border-border" onClick={() => approveClient(c.user_id, c.complex_id)}>Approve</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}

