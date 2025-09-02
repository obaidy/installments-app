import { Router } from 'express';
import type Stripe from 'stripe';
import { createOrRetrieveCustomer, storeCard, chargeCustomer } from '../../lib/stripeClient';
import { supabase } from '../../lib/supabaseServiceClient';
import { optionalUser, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /payments/checkout
 * Body: { email?: string, unitId: number, installmentId: number, paymentMethodId?: string, amountInCents?: number }
 */
router.post('/checkout', optionalUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { email: emailRaw, unitId, installmentId, paymentMethodId, amountInCents } = req.body ?? {};
    if (!unitId || !installmentId) return res.status(400).json({ error: 'unitId and installmentId required' });

    let amount = Number(amountInCents);
    if (!Number.isFinite(amount)) {
      const { data, error } = await supabase
        .from('installments')
        .select('amount_iqd')
        .eq('id', Number(installmentId))
        .single();
      if (error || !data) return res.status(404).json({ error: 'Installment not found' });
      amount = Math.round(Number(data.amount_iqd) * 100); // cents
    }

    const email = (emailRaw as string) || req.user?.email || '';
    if (!email) return res.status(400).json({ error: 'email required' });

    const customer = await createOrRetrieveCustomer(email);
    const pm = paymentMethodId || 'pm_card_visa';
    await storeCard(customer.id, pm);

    const intent: Stripe.PaymentIntent = await chargeCustomer(customer.id, amount, {
      unit_id: String(unitId),
      installment_id: String(installmentId),
    });

    await supabase.from('payments').insert({
      unit_id: Number(unitId),
      installment_id: Number(installmentId),
      amount: amount / 100,
      status: intent.status as any,
      paid_at: intent.status === 'succeeded' ? new Date().toISOString() : null,
    });

    if (intent.status === 'succeeded') {
      await supabase
        .from('installments')
        .update({ paid: true, paid_at: new Date().toISOString() })
        .eq('id', Number(installmentId));
    }

    res.json({ status: intent.status, client_secret: intent.client_secret });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? 'internal error' });
  }
});

export default router;
