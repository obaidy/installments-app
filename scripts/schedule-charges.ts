import 'dotenv/config';
import { supabase } from '../lib/supabaseClient';
import { chargeCustomer } from '../lib/stripeClient';

/**
 * Charge due installments and update their status.
 * Intended to be executed on a cron schedule.
 */
export async function main() {
  const now = new Date().toISOString();
  const { data: installments, error } = await supabase
    .from('installments')
    .select('id, unit_id, customer_id, amount')
    .eq('status', 'pending')
    .lte('due_date', now);

    if (error) throw error;
  if (!installments) return 0;

    let failures = 0;

  for (const inst of installments as any[]) {
    if (!inst.customer_id) continue;
    const amount = inst.amount as number;
    try {
      const intent = await chargeCustomer(
        inst.customer_id,
        Math.round(amount * 100),
        { unit_id: inst.unit_id, installment_id: inst.id },
      );

      await supabase.from('payments').insert({
        unit_id: inst.unit_id,
        installment_id: inst.id,
        amount,
        status: intent.status,
        paid_at: intent.status === 'succeeded' ? new Date().toISOString() : null,
      });

      const newStatus = intent.status === 'succeeded' ? 'paid' : 'failed';
      await supabase
        .from('installments')
        .update({ status: newStatus })
        .eq('id', inst.id);

      if (intent.status !== 'succeeded') {
        failures++;
        console.error(
          `❌ Charge failed for installment ${inst.id}: ${intent.status}`,
        );
      }
    } catch (err) {
      failures++;
      console.error(`❌ Error processing installment ${inst.id}:`, err);
      await supabase
        .from('installments')
        .update({ status: 'failed' })
        .eq('id', inst.id);
    }
  }

  return failures;
}

main().then((failures) => {
  if (failures > 0) {
    console.error(`Completed with ${failures} failure(s).`);
    process.exitCode = 1;
  } else {
    console.log('All charges processed successfully.');
  }
});

