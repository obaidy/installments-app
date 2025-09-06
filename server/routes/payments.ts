import { Router } from 'express';
import type Stripe from 'stripe';
import { createOrRetrieveCustomer, storeCard, chargeCustomer, stripe, attachDefaultPaymentMethod } from '../../lib/stripeClient';
import { supabase } from '../../lib/supabaseServiceClient';
import { optionalUser, requireUser, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /payments/checkout
 * Body: { email?: string, unitId: number, installmentId: number, paymentMethodId?: string, amountInCents?: number }
 */
router.post('/checkout', optionalUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { email: emailRaw, unitId, installmentId, serviceFeeId, target_type, target_id, paymentMethodId, amountInCents } = req.body ?? {};
    const targetType: 'installment'|'service_fee'|undefined = (target_type as any) || (serviceFeeId ? 'service_fee' : (installmentId ? 'installment' : undefined));
    const targetId = Number(target_id ?? (targetType === 'service_fee' ? serviceFeeId : installmentId));
    if (!unitId || !targetType || !targetId) return res.status(400).json({ error: 'unitId and target (installmentId or serviceFeeId) required' });

    let amount = Number(amountInCents);
    if (!Number.isFinite(amount)) {
      if (targetType === 'installment') {
        const { data, error } = await supabase
          .from('installments')
          .select('amount_iqd')
          .eq('id', Number(targetId))
          .single();
        if (error || !data) return res.status(404).json({ error: 'Installment not found' });
        amount = Math.round(Number(data.amount_iqd) * 100); // cents
      } else {
        const { data, error } = await supabase
          .from('service_fees')
          .select('amount_iqd')
          .eq('id', Number(targetId))
          .single();
        if (error || !data) return res.status(404).json({ error: 'Service fee not found' });
        amount = Math.round(Number(data.amount_iqd) * 100); // cents
      }
    }

    const email = (emailRaw as string) || req.user?.email || '';
    if (!email) return res.status(400).json({ error: 'email required' });

    const customer = await createOrRetrieveCustomer(email);
    const pm = paymentMethodId || 'pm_card_visa';
    await storeCard(customer.id, pm);

    const intent: Stripe.PaymentIntent = await chargeCustomer(customer.id, amount, {
      unit_id: String(unitId),
      installment_id: targetType === 'installment' ? String(targetId) : undefined,
      service_fee_id: targetType === 'service_fee' ? String(targetId) : undefined,
    } as any);

    const paymentRow: any = {
      unit_id: Number(unitId),
      amount: amount / 100,
      status: intent.status as any,
      paid_at: intent.status === 'succeeded' ? new Date().toISOString() : null,
    };
    if (targetType === 'installment') paymentRow.installment_id = Number(targetId);
    else paymentRow.service_fee_id = Number(targetId);
    await supabase.from('payments').insert(paymentRow);

    if (intent.status === 'succeeded') {
      if (targetType === 'installment') {
        await supabase
          .from('installments')
          .update({ paid: true, paid_at: new Date().toISOString() })
          .eq('id', Number(targetId));
      } else {
        await supabase
          .from('service_fees')
          .update({ paid: true, paid_at: new Date().toISOString() })
          .eq('id', Number(targetId));
      }
    }

    res.json({ status: intent.status, client_secret: intent.client_secret });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? 'internal error' });
  }
});

export default router;
/** PM + Autopay helper routes (Stripe) */
router.post('/pm/setup-intent', requireUser, async (req: AuthenticatedRequest, res) => {
  try {
    const email = req.user?.email;
    if (!email) return res.status(400).json({ ok: false, error: 'email required' });
    const customer = await createOrRetrieveCustomer(email);
    const si = await stripe.setupIntents.create({ customer: customer.id, payment_method_types: ['card'] });
    res.json({ ok: true, clientSecret: si.client_secret });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'internal error' });
  }
});

router.post('/pm/set-default', requireUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { paymentMethodId } = req.body ?? {};
    const email = req.user?.email;
    if (!email || !paymentMethodId) return res.status(400).json({ ok: false, error: 'missing fields' });
    const customer = await createOrRetrieveCustomer(email);
    await attachDefaultPaymentMethod(customer.id, paymentMethodId);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'internal error' });
  }
});

router.get('/pm/list', requireUser, async (req: AuthenticatedRequest, res) => {
  try {
    const email = req.user?.email;
    if (!email) return res.status(400).json({ ok: false, error: 'email required' });
    const customer = await createOrRetrieveCustomer(email);
    const pms = await stripe.paymentMethods.list({ customer: customer.id, type: 'card' });
    res.json({ ok: true, paymentMethods: pms.data });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'internal error' });
  }
});

router.post('/pm/detach', requireUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { paymentMethodId } = req.body ?? {};
    if (!paymentMethodId) return res.status(400).json({ ok: false, error: 'paymentMethodId required' });
    await stripe.paymentMethods.detach(paymentMethodId);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'internal error' });
  }
});

router.post('/autopay/set', requireUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { unit_id, enabled } = req.body ?? {};
    if (!unit_id || typeof enabled !== 'boolean') return res.status(400).json({ ok: false, error: 'unit_id and enabled required' });
    const { error } = await supabase.from('units').update({ autopay_enabled: !!enabled }).eq('id', Number(unit_id));
    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'internal error' });
  }
});
