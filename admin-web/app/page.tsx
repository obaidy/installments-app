"use client";
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { KpiCard } from '../components/KpiCard'
import { Sparkline } from '../components/Sparkline'
import { MoneyTable } from '../components/MoneyTableFixed'
import { Shell } from '../components/Shell'
import { supabase } from '../lib/supabaseClient';
import type { Status } from '@/lib/format';
import { StatsCard } from '../components/StatsCard'

type Row = { id: string; unit: string; dueDate: string; amount: number; status: Status };

export default function Page() {
  const [filter, setFilter] = useState<'all'|'due'|'overdue'|'paid'>('all');
  const [autopayOnly, setAutopayOnly] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [kpis, setKpis] = useState({ dueToday: 0, next30: 0, pastDue: 0, collectedMtd: 0 });
  const [recent, setRecent] = useState<{ title: string; when: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState(0);
  const [complexCount, setComplexCount] = useState(0);
  const [unitCount, setUnitCount] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [recentUsers, setRecentUsers] = useState<{ email: string; role: string }[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const now = new Date();
      // Fetch money table rows (latest 50 by due date)
      const { data: inst } = await supabase
        .from('installments')
        .select('id, amount_iqd, due_date, paid, units(name, autopay_enabled)')
        .order('due_date', { ascending: true })
        .limit(50);

      const mapped: Row[] = (inst as any[] || []).map((r) => {
        const dueDate = r.due_date as string;
        const d = new Date(dueDate);
        let status: Status = r.paid ? 'paid' : (d < now ? 'overdue' : 'due');
        return {
          id: String(r.id),
          unit: r.units?.name || `Unit ${r.unit_id ?? ''}`,
          dueDate,
          amount: r.amount_iqd as number,
          status,
          autopay: !!r.units?.autopay_enabled,
        };
      });
      setRows(mapped);

      // KPIs via RPCs
      const [{ data: dueToday }, { data: next30 }, { data: pastDue }, { data: collectedMtd }] = await Promise.all([
        supabase.rpc('sum_due_today'),
        supabase.rpc('sum_next_30'),
        supabase.rpc('sum_past_due'),
        supabase.rpc('sum_collected_mtd'),
      ]);

      setKpis({ dueToday, next30, pastDue, collectedMtd });
      // Recent payments (paid)
      const { data: recentPay } = await supabase
        .from('payments')
        .select('paid_at, amount, units(name)')
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })
        .limit(5);
      const rec = ((recentPay as any[]) || []).map((p) => ({
        title: `Payment from ${p.units?.name ?? 'Unit'}`,
        when: p.paid_at ? new Date(p.paid_at).toLocaleString() : '',
      }));
      setRecent(rec);

      // Counts
      const [uRoles, cCount, uCount, pendUsers, pendClients] = await Promise.all([
        supabase.from('user_roles').select('user_id', { count: 'exact', head: true }),
        supabase.from('complexes').select('*', { count: 'exact', head: true }),
        supabase.from('units').select('*', { count: 'exact', head: true }),
        supabase.from('user_status').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('client_complex_status').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      setUserCount(uRoles.count || 0);
      setComplexCount(cCount.count || 0);
      setUnitCount(uCount.count || 0);
      setPendingApprovals((pendUsers.count || 0) + (pendClients.count || 0));

      // Recent users (last 5 by role change order)
      const { data: users } = await supabase
        .from('user_roles')
        .select('role, profiles(email)')
        .order('role')
        .limit(5);
      setRecentUsers(((users as any[]) || []).map((r) => ({ email: r.profiles?.email || '—', role: r.role })));
      setLoading(false);
    })();
  }, []);

  const filteredRows = useMemo(() => {
    if (filter === 'all') return rows;
    let arr = rows.filter(r => r.status === filter);
    if (autopayOnly) arr = arr.filter((r: any) => !!(r as any).autopay);
    return arr;
  }, [rows, filter, autopayOnly]);

  return (
    <Shell>
      <main className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </div>
        <Card className="kpi-gradient text-white">
          <CardContent className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KpiCard title="Due Today" value={kpis.dueToday} spark={<Sparkline values={[4,6,3,8,7,10,9]} />} />
              <KpiCard title="Next 30 Days" value={kpis.next30} spark={<Sparkline values={[10,9,11,12,10,8,9]} />} />
              <KpiCard title="Past Due" value={kpis.pastDue} spark={<Sparkline values={[7,6,7,9,8,7,6]} />} />
              <KpiCard title="Collected MTD" value={kpis.collectedMtd} spark={<Sparkline values={[5,7,9,12,14,13,15]} />} />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard title="Users" value={userCount} />
          <StatsCard title="Complexes" value={complexCount} />
          <StatsCard title="Units" value={unitCount} />
          <StatsCard title="Pending Approvals" value={pendingApprovals} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant={filter==='all'?undefined:'ghost'} onClick={()=>setFilter('all')}>All</Button>
          <Button variant={filter==='due'?undefined:'ghost'} onClick={()=>setFilter('due')}>Due</Button>
          <Button variant={filter==='overdue'?undefined:'ghost'} onClick={()=>setFilter('overdue')}>Past Due</Button>
          <Button variant={filter==='paid'?undefined:'ghost'} onClick={()=>setFilter('paid')}>Paid</Button>
          <label className="ml-4 inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={autopayOnly} onChange={(e) => setAutopayOnly(e.currentTarget.checked)} /> Autopay only
          </label>
        </div>
        <MoneyTable rows={filteredRows} />
        <Card>
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground mb-2">Recent Activity</div>
            <ul className="space-y-2">
              {recent.map((r, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span>{r.title}</span>
                  <span className="text-xs opacity-70">{r.when}</span>
                </li>
              ))}
              {recent.length === 0 ? <li className="text-sm opacity-70">No recent payments</li> : null}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground mb-2">Recent Users</div>
            <ul className="space-y-2">
              {recentUsers.map((u, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span>{u.email}</span>
                  <span className="text-xs opacity-70">{u.role.toUpperCase()}</span>
                </li>
              ))}
              {recentUsers.length === 0 ? <li className="text-sm opacity-70">No users</li> : null}
            </ul>
          </CardContent>
        </Card>
      </main>
    </Shell>
  )
}

