import { Router } from 'express';
import type Stripe from 'stripe';
import { createOrRetrieveCustomer, storeCard, chargeCustomer, stripe, attachDefaultPaymentMethod } from '../../lib/stripeClient';
import { supabase, createUserClient } from '../../lib/supabaseServiceClient';
import { fromStripeMinor } from '../../lib/payments/currency';
import { stripeIntentStatusToPaymentStatus } from '../../lib/payments/status';
import { makeQiGateway } from '../payments/qiGateway';
import { optionalUser, requireUser, type AuthenticatedRequest } from '../middleware/auth';
import crypto from 'node:crypto';

const router = Router();
const USE_QI = process.env.USE_QI === '1';

function getIdempotencyKey(req: AuthenticatedRequest) {
  const header = req.headers['idempotency-key'];
  if (typeof header === 'string' && header.trim()) return header.trim();
  return (req.body as any)?.idempotencyKey as string | undefined;
}

async function requireUnitOwner(req: AuthenticatedRequest, unitId: number) {
  if (!req.accessToken) return false;
  const userClient = createUserClient(req.accessToken);
  const { data } = await userClient.from('units').select('id').eq('id', unitId).maybeSingle();
  return Boolean(data);
}

/**
 * POST /payments/checkout
 * Body: { email?: string, unitId: number, installmentId: number, paymentMethodId?: string, amountInCents?: number }
 */
router.post('/checkout', optionalUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { email: emailRaw, unitId, installmentId, serviceFeeId, target_type, target_id, paymentMethodId, amountInCents, amountIQD: amountIQDRaw, returnUrl, paylinkToken } = req.body ?? {};
    let targetType: 'installment'|'service_fee'|undefined = (target_type as any) || (serviceFeeId ? 'service_fee' : (installmentId ? 'installment' : undefined));
    let targetId = Number(target_id ?? (targetType === 'service_fee' ? serviceFeeId : installmentId));
    let resolvedUnitId = Number(unitId);
    const idempotencyKey = getIdempotencyKey(req);

    let paylink: any | null = null;
    if (paylinkToken) {
      const { data } = await supabase.from('paylinks').select('*').eq('token', String(paylinkToken)).maybeSingle();
      if (!data) return res.status(404).json({ error: 'paylink not found' });
      if (data.expires_at && new Date(data.expires_at) < new Date()) return res.status(410).json({ error: 'paylink expired' });
      if (data.target_type === 'batch') return res.status(400).json({ error: 'batch paylinks not supported here' });
      paylink = data;
      resolvedUnitId = resolvedUnitId || Number(data.unit_id);
      targetType = targetType || (data.target_type as any);
      targetId = targetId || Number(data.target_id || 0);
      if (resolvedUnitId !== Number(data.unit_id)) return res.status(400).json({ error: 'paylink unit mismatch' });
      if (targetType !== data.target_type || (data.target_id && targetId !== Number(data.target_id))) return res.status(400).json({ error: 'paylink target mismatch' });
    }

    if (!resolvedUnitId || !targetType || !targetId) {
      return res.status(400).json({ error: 'unitId and target (installmentId or serviceFeeId) required' });
    }
    if (!req.user && !paylinkToken) return res.status(401).json({ error: 'UNAUTHORIZED' });
    if (req.user && !(await requireUnitOwner(req, resolvedUnitId))) return res.status(403).json({ error: 'FORBIDDEN' });

    const lookupClient = req.accessToken ? createUserClient(req.accessToken) : supabase;
    let amountIQD = Number(amountIQDRaw);
    if (!Number.isFinite(amountIQD)) {
      const amountFromMinor = Number(amountInCents);
      if (Number.isFinite(amountFromMinor)) {
        amountIQD = fromStripeMinor(amountFromMinor);
      }
    }
    if (!Number.isFinite(amountIQD) || amountIQD <= 0) {
      if (targetType === 'installment') {
        const { data, error } = await lookupClient
          .from('installments')
          .select('amount_iqd, unit_id')
          .eq('id', Number(targetId))
          .maybeSingle();
        if (error || !data) return res.status(404).json({ error: 'Installment not found' });
        if (Number(data.unit_id) !== resolvedUnitId) return res.status(400).json({ error: 'Target mismatch' });
        amountIQD = Number(data.amount_iqd);
      } else {
        const { data, error } = await lookupClient
          .from('service_fees')
          .select('amount_iqd, unit_id')
          .eq('id', Number(targetId))
          .maybeSingle();
        if (error || !data) return res.status(404).json({ error: 'Service fee not found' });
        if (Number(data.unit_id) !== resolvedUnitId) return res.status(400).json({ error: 'Target mismatch' });
        amountIQD = Number(data.amount_iqd);
      }
    } else {
      const table = targetType === 'installment' ? 'installments' : 'service_fees';
      const { data, error } = await lookupClient
        .from(table)
        .select('id, unit_id')
        .eq('id', Number(targetId))
        .maybeSingle();
      if (error || !data) return res.status(404).json({ error: targetType === 'installment' ? 'Installment not found' : 'Service fee not found' });
      if (Number(data.unit_id) !== resolvedUnitId) return res.status(400).json({ error: 'Target mismatch' });
    }

    const email = (emailRaw as string) || req.user?.email || '';

    if (USE_QI) {
      const gateway = makeQiGateway();
      const result = await gateway.createIntent({
        amountIQD,
        description: req.body?.description,
        metadata: {
          unit_id: String(resolvedUnitId),
          target_type: targetType,
          target_id: String(targetId),
        },
        returnUrl,
        idempotencyKey,
      });
      if (!result.ok) return res.status(502).json({ ok: false, error: result.error });
      await supabase.from('payment_intents').insert({
        unit_id: resolvedUnitId,
        target_type: targetType,
        target_id: targetId,
        amount: amountIQD,
        provider: 'qi',
        provider_ref: result.referenceId,
        status: 'created',
        return_url: returnUrl ?? null,
      });
      return res.json({ ok: true, referenceId: result.referenceId, redirectUrl: result.redirectUrl });
    }

    if (!email) return res.status(400).json({ error: 'email required' });

    const customer = await createOrRetrieveCustomer(email);
    const pm = paymentMethodId || 'pm_card_visa';
    await storeCard(customer.id, pm);

    const intent: Stripe.PaymentIntent = await chargeCustomer(customer.id, amountIQD, {
      unit_id: String(resolvedUnitId),
      installment_id: targetType === 'installment' ? String(targetId) : undefined,
      service_fee_id: targetType === 'service_fee' ? String(targetId) : undefined,
    } as any, idempotencyKey);

    const status = stripeIntentStatusToPaymentStatus(intent.status);
    const paymentRow: any = {
      unit_id: Number(resolvedUnitId),
      amount: amountIQD,
      status,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
    };
    if (targetType === 'installment') paymentRow.installment_id = Number(targetId);
    else paymentRow.service_fee_id = Number(targetId);
    await supabase.from('payments').insert(paymentRow);

    if (status === 'paid') {
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

    res.json({ ok: true, status, client_secret: intent.client_secret, referenceId: intent.id });
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
    if (USE_QI) {
      const status = await makeQiGateway().getStatus(ref);
      return res.json({ status });
    }
    const pi: Stripe.PaymentIntent = await (await import('../../lib/stripeClient')).stripe.paymentIntents.retrieve(ref);
    const status = stripeIntentStatusToPaymentStatus(pi.status);
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
    if (USE_QI) return res.status(400).json({ ok: false, error: 'batch checkout not supported for Qi' });
    if (!req.user) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    if (!(await requireUnitOwner(req, Number(unitId)))) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const idempotencyKey = getIdempotencyKey(req);
    const lookupClient = req.accessToken ? createUserClient(req.accessToken) : supabase;

    // Sum amounts and load targets
    let total = 0;
    const rows: Array<{ type: 'installment'|'service_fee'; id: number; amount: number }> = [];
    for (const it of items) {
      if (!it?.type || !it?.id) continue;
      if (it.type === 'installment') {
        const { data } = await lookupClient.from('installments').select('amount_iqd, unit_id').eq('id', Number(it.id)).maybeSingle();
        if (!data || Number((data as any)?.unit_id) !== Number(unitId)) continue;
        const amt = Number((data as any)?.amount_iqd || 0);
        rows.push({ type: 'installment', id: Number(it.id), amount: amt }); total += amt;
      } else {
        const { data } = await lookupClient.from('service_fees').select('amount_iqd, unit_id').eq('id', Number(it.id)).maybeSingle();
        if (!data || Number((data as any)?.unit_id) !== Number(unitId)) continue;
        const amt = Number((data as any)?.amount_iqd || 0);
        rows.push({ type: 'service_fee', id: Number(it.id), amount: amt }); total += amt;
      }
    }
    if (rows.length === 0 || total <= 0) return res.status(400).json({ ok: false, error: 'No items with amounts' });

    const email = (emailRaw as string) || req.user?.email || '';
    if (!email) return res.status(400).json({ ok: false, error: 'email required' });

    const customer = await createOrRetrieveCustomer(email);
    const intent = await chargeCustomer(customer.id, total, { unit_id: String(unitId), batch: '1' } as any, idempotencyKey);

    // Record items to payment_intents for webhook reconciliation
    for (const r of rows) {
      await supabase.from('payment_intents').insert({ unit_id: Number(unitId), target_type: r.type, target_id: r.id, amount: r.amount, provider: 'stripe', provider_ref: intent.id, status: intent.status as any });
    }

    const batchStatus = stripeIntentStatusToPaymentStatus(intent.status);
    if (batchStatus === 'paid') {
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
    let amount = Number(amountIQD);
    if (!Number.isFinite(amount)) {
      const minor = Number(amountInCents);
      if (Number.isFinite(minor)) amount = fromStripeMinor(minor);
    }
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ ok: false, error: 'invalid amount' });
    const email = req.user?.email || '';
    if (!email) return res.status(400).json({ ok: false, error: 'email required' });
    const customer = await createOrRetrieveCustomer(email);
    const idempotencyKey = getIdempotencyKey(req);
    const intent = await chargeCustomer(customer.id, amount, { wallet_topup: '1', user_id: req.user!.id } as any, idempotencyKey);
    if (intent.status === 'succeeded') {
      const { error } = await supabase.rpc('wallet_topup', { p_user_id: req.user!.id, p_amount: amount, p_ref: intent.id });
      if (error) return res.status(500).json({ ok: false, error: error.message });
    }
    res.json({ ok: true, status: stripeIntentStatusToPaymentStatus(intent.status) });
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
    if (!(await requireUnitOwner(req, Number(unit_id)))) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
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
    if (!(await requireUnitOwner(req, Number(unit_id)))) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
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
    if (unitId && !(await requireUnitOwner(req, Number(unitId)))) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const { data, error } = await supabase.rpc('wallet_apply', { p_user_id: req.user!.id, p_unit_id: unitId ? Number(unitId) : null });
    if (error) return res.status(500).json({ ok: false, error: error.message });
    const row = Array.isArray(data) ? data[0] : data;
    res.json({ ok: true, applied: Number(row?.applied || 0), remaining: Number(row?.remaining || 0) });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'internal error' });
  }
});
