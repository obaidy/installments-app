import { Router } from 'express';
import type Stripe from 'stripe';
import { stripe } from '../../lib/stripeClient';
import { supabase } from '../../lib/supabaseServiceClient';
import { requireAdmin } from '../middleware/auth';
import { fromStripeMinor } from '../../lib/payments/currency';
import { stripeIntentStatusToPaymentStatus } from '../../lib/payments/status';

const router = Router();

/** POST /reconcile/by-intent  Body: { payment_intent_id: string, installment_id?: number, unit_id?: number } */
router.post('/by-intent', requireAdmin, async (req, res) => {
  try {
    const { payment_intent_id, installment_id, unit_id } = req.body ?? {};
    if (!payment_intent_id) return res.status(400).json({ error: 'payment_intent_id required' });

    const pi: Stripe.PaymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id, {
      expand: ['charges.data.balance_transaction'],
    });

    const unitId = Number(unit_id ?? pi.metadata?.unit_id ?? 0) || null;
    const instId = Number(installment_id ?? pi.metadata?.installment_id ?? 0) || null;
    const amount = fromStripeMinor(pi.amount_received || pi.amount || 0);
    const status = stripeIntentStatusToPaymentStatus(pi.status);

    if (!unitId || !instId) {
      return res.status(400).json({ error: 'unit_id / installment_id missing (metadata or body)' });
    }

    await supabase.from('payments').insert({
      unit_id: unitId,
      installment_id: instId,
      amount,
      status,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
    });

    if (status === 'paid') {
      await supabase
        .from('installments')
        .update({ paid: true, paid_at: new Date().toISOString() })
        .eq('id', instId);
    }

    res.json({ ok: true, intent_status: pi.status });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? 'internal error' });
  }
});

router.get('/preview/:installmentId', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.installmentId);
    if (!id) return res.status(400).json({ error: 'installmentId required' });

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('installment_id', id)
      .order('paid_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ data });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? 'internal error' });
  }
});

export default router;
