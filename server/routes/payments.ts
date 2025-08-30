import express from "express";
import { z } from "zod";
import { validateBody, validateParams } from "../utils/validate";
import { requireAuth, requireRole, assertUnitAccess } from "../middleware/auth";
import { chargeCustomer } from "../../lib/stripeClient";
import { makeStripeGateway } from "../payments/stripeGateway";
import { makeQiGateway } from "../payments/qiGateway";
import { supabaseService } from "../../lib/supabaseServiceClient";


const router = express.Router();


const useQi = process.env.USE_QI === "1";
const stripeSecret = process.env.STRIPE_SECRET_KEY || "";


const gateway = useQi ? makeQiGateway() : makeStripeGateway(stripeSecret);


// Schemas
const checkoutSchema = z.object({
  amountIQD: z.coerce.number().positive(),
  description: z.string().optional(),
  returnUrl: z.string().url().optional(),
  metadata: z.record(z.string()).default({}).optional(),
  target_type: z.enum(['installment','service_fee']).optional(),
  target_id: z.coerce.number().optional(),
});

const statusSchema = z.object({ ref: z.string().min(1) });

// POST /payments/checkout
router.post("/checkout", validateBody(checkoutSchema), async (req, res) => {
try {
const { amountIQD: amt, description, returnUrl, metadata, target_type, target_id } = (req as any).data as z.infer<typeof checkoutSchema>;
const idempotencyKey = (req.headers['x-idempotency-key'] as string | undefined) || undefined;
// Resolve unit_id from target if provided
let unitId: number | undefined = undefined;
if (target_type && target_id) {
  if (target_type === 'installment' || target_type === 'installments') {
    const { data } = await supabaseService.from('installments').select('unit_id').eq('id', target_id).single();
    unitId = (data as any)?.unit_id as number | undefined;
  } else if (target_type === 'service_fee' || target_type === 'service_fees') {
    const { data } = await supabaseService.from('service_fees').select('unit_id').eq('id', target_id).single();
    unitId = (data as any)?.unit_id as number | undefined;
  }
}
// Record payment_intent row (created)
let intentId: string | undefined;
if (target_type && target_id) {
  const { data: intent } = await supabaseService
    .from('payment_intents')
    .insert({ unit_id: unitId, target_type: target_type === 'service_fee' ? 'service_fee' : 'installment', target_id, amount: amountIQD, status: 'created', return_url: returnUrl || null })
    .select('id')
    .single();
  intentId = (intent as any)?.id as string | undefined;
}

const result = await gateway.createIntent({ amountIQD: amt, description, returnUrl, metadata, idempotencyKey });

// Update intent with provider ref if known
try {
  const ref = (result as any).referenceId || (result as any).id || (result as any).providerRef;
  if (intentId && ref) {
    await supabaseService
      .from('payment_intents')
      .update({ provider: useQi ? 'qi' : 'stripe', provider_ref: ref, status: 'processing' })
      .eq('id', intentId);
  }
} catch {}
res.status(result.ok ? 200 : 400).json(result);
} catch (e: any) {
res.status(500).json({ ok: false, error: { code: 'INTERNAL', message: e?.message || 'server error' } });
}
});


// GET /payments/status/:ref
router.get("/status/:ref", validateParams(statusSchema), async (req, res) => {
try {
const status = await gateway.getStatus((req as any).paramsData.ref);
res.json({ status });
} catch (e: any) {
res.status(500).json({ ok: false, error: { code: 'INTERNAL', message: e?.message || 'server error' } });
}
});

// POST /payments/charge-now { unit_id }
const chargeNowSchema = z.object({ unit_id: z.coerce.number() });
router.post('/charge-now', requireAuth(), validateBody(chargeNowSchema), async (req: any, res) => {
  try {
    const { unit_id } = req.data as z.infer<typeof chargeNowSchema>;
    // allow admins/accountants or managers/owners via assertUnitAccess
    const { data: roleRow } = await supabaseService.from('user_roles').select('role').eq('user_id', req.user.id).single();
    const role = (roleRow as any)?.role as string | null;
    const allowed = role === 'admin' || role === 'accountant' || (await assertUnitAccess(req.user.id, unit_id));
    if (!allowed) return res.status(403).json({ ok: false, error: { code: 'FORBIDDEN' } });

    // find earliest due unpaid installment for unit
    const { data: inst } = await supabaseService
      .from('installments')
      .select('id, unit_id, amount_iqd, paid, due_date, units(customer_id)')
      .eq('unit_id', unit_id)
      .eq('paid', false)
      .lte('due_date', new Date().toISOString())
      .order('due_date', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!inst) return res.status(404).json({ ok: false, error: { code: 'NOTHING_TO_CHARGE' } });
    const customerId = (inst as any).units?.customer_id as string | undefined;
    if (!customerId) return res.status(400).json({ ok: false, error: { code: 'NO_CUSTOMER' } });
    const amountCents = Math.round((inst as any).amount_iqd * 100);
    const intent = await chargeCustomer(customerId, amountCents, { unit_id, installment_id: (inst as any).id });
    return res.json({ ok: true, payment_intent: { id: intent.id, status: intent.status } });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL', message: e?.message || 'server error' } });
  }
});


export default router;
