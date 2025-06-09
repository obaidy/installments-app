import { supabase } from '../lib/supabaseClient';
import { chargeCustomer } from '../lib/stripeClient';

/**
 * Run scheduled charges for all units.
 * This script should be triggered by a cron job on your server.
 */
async function run() {
  // Fetch units with complex commission and service fee
  const { data: units } = await supabase
    .from('units')
    .select('id, service_fee, customer_id, complex:complexes(id, commission)');

  if (!units) return;

  for (const unit of units as any[]) {
    if (!unit.customer_id) continue;
    const fee = unit.service_fee as number;
    const commission = unit.complex?.commission || 0;
    const amount = fee - commission;
    await chargeCustomer(unit.customer_id, Math.round(amount * 100), {
      unit_id: unit.id,
      complex_id: unit.complex?.id,
    });
    await supabase.from('payments').insert({
      unit_id: unit.id,
      amount: amount,
      commission,
      status: 'paid',
      paid_at: new Date().toISOString(),
    });
  }
}

run();

