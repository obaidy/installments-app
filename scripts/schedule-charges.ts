import 'dotenv/config';
import { supabase } from '../lib/supabaseClient';
import { chargeCustomer } from '../lib/stripeClient';

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

/**
 * Charge due installments and update their status.
 * Intended to be executed on a cron schedule.
 */
export async function main() {
  const now = new Date().toISOString();
  const { data: installments, error } = await supabase
    .from('installments')
    .select('id, unit_id, amount_iqd, units(customer_id)')
    .eq('paid', false)
    .lte('due_date', now);

    if (error) throw error;
  if (!installments) return 0;

    let failures = 0;

  for (const inst of installments as any[]) {
    const customerId = inst.units?.customer_id;
    if (!customerId) continue;
    const amount = inst.amount_iqd as number;
    try {
      const intent = await chargeCustomer(
        customerId,
        Math.round(amount * 100),
        { unit_id: inst.unit_id, installment_id: inst.id },
      );

       const status: PaymentStatus = ((): PaymentStatus => {
        switch (intent.status) {
          case 'succeeded':
            return 'paid';
          case 'processing':
            return 'pending';
          case 'canceled':
            return 'cancelled';
          case 'requires_payment_method':
            return 'failed';
          default:
            return 'failed';
        }
      })();

      await supabase.from('payments').insert({
        unit_id: inst.unit_id,
        installment_id: inst.id,
        amount,
        status,
        paid_at: status === 'paid' ? new Date().toISOString() : null,
      });

      await supabase
        .from('installments')
        .update({
          paid: status === 'paid',
          paid_at: status === 'paid' ? new Date().toISOString() : null,
        })
        .eq('id', inst.id);

      if (status !== 'paid') {
        failures++;
        console.error(
          `❌ Charge failed for installment ${inst.id}: ${intent.status}`,
        );
      }
    } catch (err) {
      failures++;
      console.error(`❌ Error processing installment ${inst.id}:`, err);
      await supabase.from('payments').insert({
        unit_id: inst.unit_id,
        installment_id: inst.id,
        amount,
        status: 'failed',
        paid_at: null,
      });
      await supabase
        .from('installments')
        .update({ paid: false })
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

