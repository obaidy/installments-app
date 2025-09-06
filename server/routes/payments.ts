import { Router } from 'express';
import type Stripe from 'stripe';
import { createOrRetrieveCustomer, storeCard, chargeCustomer, stripe, attachDefaultPaymentMethod } from '../../lib/stripeClient';
import { supabase } from '../../lib/supabaseServiceClient';
import { optionalUser, requireUser, type AuthenticatedRequest } from '../middleware/auth';
import crypto from 'node:crypto';

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

    res.json({ ok: true, status: intent.status, client_secret: intent.client_secret, referenceId: intent.id });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? 'internal error' });
  }
});

export default router;

/**
 * GET /payments/status/:ref
 */
router.get('/status/:ref', async (req, res) => {
  try {
    const ref = req.params.ref;
    if (!ref) return res.status(400).json({ error: 'ref required' });
    const pi: Stripe.PaymentIntent = await (await import('../../lib/stripeClient')).stripe.paymentIntents.retrieve(ref);
    let status: 'pending'|'paid'|'failed'|'cancelled' = 'pending';
    if (pi.status === 'succeeded') status = 'paid';
    else if (pi.status === 'canceled') status = 'cancelled';
    else if (pi.status === 'requires_payment_method' || pi.status === 'requires_confirmation' || pi.status === 'processing') status = 'pending';
    else if (pi.status === 'requires_action') status = 'pending';
    else status = 'failed';
    res.json({ status });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'internal error' });
  }
});

/**
 * POST /payments/checkout-batch
 * Body: { unitId: number, items: Array<{ type: 'installment'|'service_fee'; id: number }>, email?: string }
 */
router.post('/checkout-batch', optionalUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { unitId, items = [], email: emailRaw } = req.body ?? {};
    if (!unitId || !Array.isArray(items) || items.length === 0) return res.status(400).json({ ok: false, error: 'unitId and items required' });

    // Sum amounts and load targets
    let total = 0;
    const rows: Array<{ type: 'installment'|'service_fee'; id: number; amount: number }> = [];
    for (const it of items) {
      if (!it?.type || !it?.id) continue;
      if (it.type === 'installment') {
        const { data } = await supabase.from('installments').select('amount_iqd').eq('id', Number(it.id)).single();
        const amt = Number((data as any)?.amount_iqd || 0);
        rows.push({ type: 'installment', id: Number(it.id), amount: amt }); total += amt;
      } else {
        const { data } = await supabase.from('service_fees').select('amount_iqd').eq('id', Number(it.id)).single();
        const amt = Number((data as any)?.amount_iqd || 0);
        rows.push({ type: 'service_fee', id: Number(it.id), amount: amt }); total += amt;
      }
    }
    if (rows.length === 0 || total <= 0) return res.status(400).json({ ok: false, error: 'No items with amounts' });

    const email = (emailRaw as string) || req.user?.email || '';
    if (!email) return res.status(400).json({ ok: false, error: 'email required' });

    const customer = await createOrRetrieveCustomer(email);
    const intent = await chargeCustomer(customer.id, Math.round(total * 100), { unit_id: String(unitId), batch: '1' } as any);

    // Record items to payment_intents for webhook reconciliation
    for (const r of rows) {
      await supabase.from('payment_intents').insert({ unit_id: Number(unitId), target_type: r.type, target_id: r.id, amount: r.amount, provider: 'stripe', provider_ref: intent.id, status: intent.status as any });
    }

    if (intent.status === 'succeeded') {
      // Mirror immediately
      for (const r of rows) {
        await supabase.from('payments').insert({ unit_id: Number(unitId), amount: r.amount, status: 'paid', paid_at: new Date().toISOString(), ...(r.type === 'installment' ? { installment_id: r.id } : { service_fee_id: r.id }) } as any);
        if (r.type === 'installment') await supabase.from('installments').update({ paid: true, paid_at: new Date().toISOString() }).eq('id', r.id);
        else await supabase.from('service_fees').update({ paid: true, paid_at: new Date().toISOString() }).eq('id', r.id);
      }
    }

    res.json({ ok: true, referenceId: intent.id });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'internal error' });
  }
});

/** Wallet endpoints */
router.post('/wallet/topup', requireUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { amountIQD, amountInCents } = req.body ?? {};
    let amountCents = Number(amountInCents);
    if (!Number.isFinite(amountCents)) amountCents = Math.round(Number(amountIQD) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) return res.status(400).json({ ok: false, error: 'invalid amount' });
    const email = req.user?.email || '';
    if (!email) return res.status(400).json({ ok: false, error: 'email required' });
    const customer = await createOrRetrieveCustomer(email);
    const intent = await chargeCustomer(customer.id, amountCents, { wallet_topup: '1', user_id: req.user!.id } as any);
    if (intent.status === 'succeeded') {
      const amount = amountCents / 100;
      await supabase.from('wallets').upsert({ user_id: req.user!.id, balance: 0 });
      await supabase.from('wallet_transactions').insert({ user_id: req.user!.id, amount, kind: 'topup', ref: intent.id });
      // Update balance: in a real app, use a DB trigger. Here we read + write.
      const { data: w } = await supabase.from('wallets').select('balance').eq('user_id', req.user!.id).maybeSingle();
      const newBal = Number((w as any)?.balance || 0) + amount;
      await supabase.from('wallets').upsert({ user_id: req.user!.id, balance: newBal });
    }
    res.json({ ok: true, status: intent.status });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'internal error' });
  }
});

/**
 * Family/Friend payer link endpoints
 */
router.post('/paylink/create', requireUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { unit_id, target_type, target_id, amount, expires_in_minutes = 60 } = req.body ?? {};
    if (!unit_id || !target_type) return res.status(400).json({ ok: false, error: 'unit_id and target_type required' });
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + Number(expires_in_minutes) * 60_000).toISOString();
    await supabase.from('paylinks').insert({ token, unit_id: Number(unit_id), target_type, target_id: target_id ? Number(target_id) : null, amount: amount ? Number(amount) : null, expires_at: expiresAt, created_by: req.user?.id ?? null } as any);
    res.json({ ok: true, token, url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'}/pay/${token}` });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'internal error' });
  }
});

router.get('/paylink/:token', async (req, res) => {
  try {
    const token = req.params.token;
    const { data } = await supabase.from('paylinks').select('*').eq('token', token).maybeSingle();
    if (!data) return res.status(404).json({ ok: false, error: 'not found' });
    if (data.expires_at && new Date(data.expires_at) < new Date()) return res.status(410).json({ ok: false, error: 'expired' });
    res.json({ ok: true, data });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'internal error' });
  }
});

/**
 * Simple receipt endpoint
 */
router.get('/receipt/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { data } = await supabase.from('payments').select('id, unit_id, installment_id, service_fee_id, amount, status, paid_at').eq('id', id).maybeSingle();
    if (!data) return res.status(404).json({ ok: false, error: 'not found' });
    // naive signature for demo
    const sig = crypto.createHash('sha256').update(String(data.id) + '|' + String(data.amount)).digest('hex').slice(0, 16);
    res.json({ ok: true, receipt: data, verify: sig });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'internal error' });
  }
});
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
router.get('/wallet/balance', requireUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { data } = await supabase.from('wallets').select('balance').eq('user_id', req.user!.id).maybeSingle();
    res.json({ ok: true, balance: Number((data as any)?.balance || 0) });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'internal error' });
  }
});

router.post('/wallet/apply', requireUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { unitId } = req.body ?? {};
    const { data: w } = await supabase.from('wallets').select('balance').eq('user_id', req.user!.id).maybeSingle();
    let remaining = Number((w as any)?.balance || 0);
    if (remaining <= 0) return res.json({ ok: true, applied: 0, remaining });

    // Find unpaid dues for user's units
    const { data: units } = await supabase.from('units').select('id').eq('user_id', req.user!.id);
    const unitIds = (units as any[] || []).map((u:any)=>u.id as number).filter(Boolean);
    if (!unitIds.length) return res.json({ ok: true, applied: 0, remaining });
    const inScope = Array.isArray(unitId) ? unitId : unitId ? [Number(unitId)] : unitIds;

    const dues: Array<{ kind:'installment'|'service_fee'; id:number; unit_id:number; amount:number; due: string }>= [];
    const [inst, fees] = await Promise.all([
      supabase.from('installments').select('id, unit_id, amount_iqd, due_date, paid').in('unit_id', inScope).eq('paid', false).order('due_date'),
      supabase.from('service_fees').select('id, unit_id, amount_iqd, due_date, paid').in('unit_id', inScope).eq('paid', false).order('due_date')
    ]);
    (inst.data||[]).forEach((r:any)=>dues.push({ kind:'installment', id:r.id, unit_id:r.unit_id, amount: Number(r.amount_iqd), due: r.due_date }));
    (fees.data||[]).forEach((r:any)=>dues.push({ kind:'service_fee', id:r.id, unit_id:r.unit_id, amount: Number(r.amount_iqd), due: r.due_date }));
    dues.sort((a,b)=>new Date(a.due).getTime()-new Date(b.due).getTime());

    let applied = 0;
    for (const d of dues) {
      if (remaining <= 0) break;
      if (d.amount <= remaining) {
        // apply full
        await supabase.from('payments').insert({ unit_id: d.unit_id, amount: d.amount, status: 'paid', paid_at: new Date().toISOString(), ...(d.kind==='installment'?{ installment_id: d.id }:{ service_fee_id: d.id }) } as any);
        if (d.kind==='installment') await supabase.from('installments').update({ paid: true, paid_at: new Date().toISOString() }).eq('id', d.id);
        else await supabase.from('service_fees').update({ paid: true, paid_at: new Date().toISOString() }).eq('id', d.id);
        await supabase.from('wallet_transactions').insert({ user_id: req.user!.id, amount: -d.amount, kind: 'apply', ref: `${d.kind}:${d.id}` });
        remaining -= d.amount; applied += d.amount;
      }
    }
    await supabase.from('wallets').upsert({ user_id: req.user!.id, balance: remaining });
    res.json({ ok: true, applied, remaining });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'internal error' });
  }
});
