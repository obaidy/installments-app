import 'dotenv/config';
import { supabaseService } from '../lib/supabaseServiceClient';

const GRACE_DAYS = Number(process.env.DUNNING_GRACE_DAYS || 3);
const LATE_FEE_IQD = Number(process.env.DUNNING_LATE_FEE_IQD || 10000);

function daysBetween(a: Date, b: Date) {
  return Math.floor((+a - +b) / (1000*60*60*24));
}

async function main() {
  const now = new Date();
  // Overdue items (installments + service_fees), excluding open promises
  const [inst, fees, promises] = await Promise.all([
    supabaseService.from('installments').select('id, unit_id, amount_iqd, due_date, paid, units(autopay_enabled)').eq('paid', false).lte('due_date', now.toISOString()).limit(5000),
    supabaseService.from('service_fees').select('id, unit_id, amount_iqd, due_date, paid, units(autopay_enabled)').eq('paid', false).lte('due_date', now.toISOString()).limit(5000),
    supabaseService.from('promises').select('target_type, target_id, promise_date, status').eq('status','open'),
  ]);

  const promiseSet = new Set<string>();
  (promises.data || []).forEach((p: any) => {
    if (new Date(p.promise_date) >= now) promiseSet.add(`${p.target_type}:${p.target_id}`);
  });

  const overdue: Array<{ kind: 'installment'|'service_fee'; id: number; unit_id: number; due: Date }>= [];
  (inst.data || []).forEach((i: any) => { if (!i.units?.autopay_enabled) overdue.push({ kind: 'installment', id: i.id, unit_id: i.unit_id, due: new Date(i.due_date) }); });
  (fees.data || []).forEach((i: any) => { if (!i.units?.autopay_enabled) overdue.push({ kind: 'service_fee', id: i.id, unit_id: i.unit_id, due: new Date(i.due_date) }); });

  let remindersQueued = 0;
  let lateFeesCreated = 0;

  for (const d of overdue) {
    const key = `${d.kind}:${d.id}`;
    if (promiseSet.has(key)) continue; // paused due to promise
    const daysOver = daysBetween(now, d.due);

    // Queue reminder for current stage
    const stage = daysOver <= 30 ? '0-30' : daysOver <= 60 ? '31-60' : daysOver <= 90 ? '61-90' : '90+';
    // Avoid duplicate reminders in last 24h
    const since = new Date(now.getTime() - 24*60*60*1000).toISOString();
    const { data: recent } = await supabaseService
      .from('reminders')
      .select('id')
      .eq('target_type', d.kind)
      .eq('target_id', d.id)
      .eq('template_code', stage)
      .gte('schedule_at', since)
      .limit(1);
    if (!recent || recent.length === 0) {
      await supabaseService.from('reminders').insert({ target_type: d.kind, target_id: d.id, schedule_at: now.toISOString(), channel: 'push', template_code: stage });
      remindersQueued++;
    }

    // Late fee after grace
    if (daysOver > GRACE_DAYS) {
      // Check if a late fee already created for this unit today
      const start = new Date(now); start.setHours(0,0,0,0);
      const end = new Date(start); end.setDate(end.getDate()+1);
      const { data: existing } = await supabaseService
        .from('service_fees')
        .select('id')
        .eq('unit_id', d.unit_id)
        .eq('label', 'Late Fee')
        .gte('due_date', start.toISOString())
        .lt('due_date', end.toISOString())
        .limit(1);
      if (!existing || existing.length === 0) {
        await supabaseService.from('service_fees').insert({ unit_id: d.unit_id, label: 'Late Fee', amount_iqd: LATE_FEE_IQD, due_date: now.toISOString(), paid: false });
        await supabaseService.from('audit_log').insert({ action: 'late_fee_applied', entity: 'unit', entity_id: String(d.unit_id), meta: { base: key, amount: LATE_FEE_IQD } });
        lateFeesCreated++;
      }
    }
  }

  console.log(`Queued reminders: ${remindersQueued}, Late fees created: ${lateFeesCreated}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

