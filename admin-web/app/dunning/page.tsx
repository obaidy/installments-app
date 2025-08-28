"use client";
import { useEffect, useMemo, useState } from 'react';
import { Shell } from '@/components/Shell';
import { supabase } from '@/lib/supabaseClient';

type Due = { kind: 'installment'|'service_fee'; id: number; unit: string; amount: number; dueDate: string; daysOver: number; userId?: string };

export default function DunningPage() {
  const [dues, setDues] = useState<Due[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [stage, setStage] = useState<'0-30'|'31-60'|'61-90'|'90+'>('0-30');

  useEffect(() => { fetchDues(); }, []);

  async function fetchDues() {
    const now = new Date();
    const [inst, fees] = await Promise.all([
      supabase.from('installments').select('id, unit_id, amount_iqd, due_date, paid, units(name, user_id)').eq('paid', false).lte('due_date', now.toISOString()).limit(2000),
      supabase.from('service_fees').select('id, unit_id, amount_iqd, due_date, paid, units(name, user_id)').eq('paid', false).lte('due_date', now.toISOString()).limit(2000),
    ]);
    const mapOne = (k: 'installment'|'service_fee') => (r: any): Due => {
      const d = new Date(r.due_date as string);
      const daysOver = Math.floor((+now - +d) / (1000*60*60*24));
      return { kind: k, id: r.id as number, unit: r.units?.name || '-', amount: r.amount_iqd as number, dueDate: r.due_date as string, daysOver, userId: r.units?.user_id };
    };
    const all: Due[] = [
      ...(((inst.data as any[]) || []).map(mapOne('installment'))),
      ...(((fees.data as any[]) || []).map(mapOne('service_fee'))),
    ];
    setDues(all);
  }

  const filtered = useMemo(() => {
    const ranges: Record<string, (d: number) => boolean> = {
      '0-30': (d) => d >= 0 && d <= 30,
      '31-60': (d) => d >= 31 && d <= 60,
      '61-90': (d) => d >= 61 && d <= 90,
      '90+': (d) => d > 90,
    };
    return dues.filter(d => ranges[stage](d.daysOver));
  }, [dues, stage]);

  function toggle(id: string) {
    setSelected(s => ({ ...s, [id]: !s[id] }));
  }

  async function sendReminders() {
    const items = filtered.filter(d => selected[keyFor(d)]);
    const now = new Date();
    for (const it of items) {
      await supabase.from('reminders').insert({ user_id: it.userId, target_type: it.kind, target_id: it.id, schedule_at: now.toISOString(), channel: 'push', template_code: stage });
    }
    setSelected({});
  }

  function keyFor(d: Due) { return `${d.kind}:${d.id}`; }

  return (
    <Shell>
      <h1 className="text-2xl font-semibold mb-4">Dunning</h1>
      <div className="flex items-center gap-2 mb-4">
        {(['0-30','31-60','61-90','90+'] as const).map(s => (
          <button key={s} className={"px-3 py-1.5 rounded-md border border-border "+(stage===s?'bg-muted/30':'')} onClick={() => setStage(s)}>{s}</button>
        ))}
        <div className="flex-1" />
        <button className="px-3 py-1.5 rounded-md border border-border" onClick={sendReminders}>Send Reminders</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40"><tr>
            <th className="p-2"></th>
            <th className="p-2 text-left">Unit</th>
            <th className="p-2 text-left">Due Date</th>
            <th className="p-2 text-left">Days Over</th>
            <th className="p-2 text-left">Amount</th>
            <th className="p-2 text-left">Type</th>
          </tr></thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={keyFor(d)} className="border-t border-border">
                <td className="p-2"><input type="checkbox" checked={!!selected[keyFor(d)]} onChange={() => toggle(keyFor(d))} /></td>
                <td className="p-2">{d.unit}</td>
                <td className="p-2">{new Date(d.dueDate).toLocaleDateString()}</td>
                <td className="p-2">{d.daysOver}</td>
                <td className="p-2">{d.amount}</td>
                <td className="p-2">{d.kind}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

