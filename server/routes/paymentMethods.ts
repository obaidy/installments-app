import express from 'express';
import { z } from 'zod';
import { validateBody, validateQuery } from '../utils/validate
import { supabaseService } from '../../lib/supabaseServiceClient';
import {
  stripe,
  createOrRetrieveCustomer,
  attachDefaultPaymentMethod,
} from '../../lib/stripeClient';
import { AuthedRequest, requireAuth, assertUnitAccess } from '../middleware/auth';
const router = express.Router();

const unitSchema = z.object({ unit_id: z.coerce.number() });

// Helper: ensure Stripe customer for a unit, storing on units.customer_id
async function getOrCreateCustomerForUnit(unitId: number) {
  interface UnitRow {
    id: number;
    customer_id: string | null;
    user_id: string;
    profiles?: { email: string | null } | null;
  }
  const { data: unit, error } = await supabaseService
    .from<UnitRow>('units')
    .select('id, customer_id, user_id, profiles: user_id ( email )')
    .eq('id', unitId)
    .single();
  if (error || !unit) throw new Error('Unit not found');
  if (unit.customer_id) {
    return unit.customer_id;
  }
  const email = unit.profiles?.email ?? 'user@example.com';
  const customer = await createOrRetrieveCustomer(email);
  await supabaseService.from('units').update({ customer_id: customer.id }).eq('id', unitId);
  return customer.id as string;
}

// All PM routes require auth
router.use(requireAuth());

// POST /payments/pm/setup-intent { unit_id }
router.post(
  '/pm/setup-intent',
  validateBody(unitSchema),
  async (
    req: AuthedRequest<z.infer<typeof unitSchema>>,
    res,
  ) => {
    try {
      const { unit_id } = req.body;
      // Owner only for setup intent
      interface UnitOwner {
        user_id: string;
      }
      const { data: unit } = await supabaseService
        .from<UnitOwner>('units')
        .select('user_id')
        .eq('id', unit_id)
        .single();
      if (!unit || unit.user_id !== req.user!.id)
        return res
          .status(403)
          .json({ ok: false, error: { code: 'FORBIDDEN' } });
      const customerId = await getOrCreateCustomerForUnit(unit_id);
      const intent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      });
      return res.json({ ok: true, clientSecret: intent.client_secret });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: e?.message || 'server error' });
    }
  },
);

// POST /payments/pm/set-default { unit_id, paymentMethodId }
const setDefaultSchema = unitSchema.extend({ paymentMethodId: z.string().min(1) });
rrouter.post(
  '/pm/set-default',
  validateBody(setDefaultSchema),
  async (
    req: AuthedRequest<z.infer<typeof setDefaultSchema>>,
    res,
  ) => {
    try {
      const { unit_id, paymentMethodId } = req.body;
      // Owner only
      interface UnitOwner {
        user_id: string;
      }
      const { data: unit } = await supabaseService
        .from<UnitOwner>('units')
        .select('user_id')
        .eq('id', unit_id)
        .single();
      if (!unit || unit.user_id !== req.user!.id)
        return res
          .status(403)
          .json({ ok: false, error: { code: 'FORBIDDEN' } });
      const customerId = await getOrCreateCustomerForUnit(unit_id);
      await attachDefaultPaymentMethod(customerId, paymentMethodId);
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: e?.message || 'server error' });
    }
  },
);

// GET /payments/pm/list?unit_id=123
router.get(
  '/pm/list',
  validateQuery(unitSchema),
  async (
    req: AuthedRequest<unknown, unknown, z.infer<typeof unitSchema>>,
    res,
  ) => {
    try {
      const { unit_id } = req.query;
      // Managers or owners may view
      if (!(await assertUnitAccess(req.user!.id, unit_id)))
        return res
          .status(403)
          .json({ ok: false, error: { code: 'FORBIDDEN' } });
      const customerId = await getOrCreateCustomerForUnit(unit_id);
      const pms = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return res.json({ ok: true, paymentMethods: pms.data });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: e?.message || 'server error' });
    }
  },
);

// POST /payments/pm/detach { unit_id, paymentMethodId }
const detachSchema = setDefaultSchema;
router.post(
  '/pm/detach',
  validateBody(detachSchema),
  async (
    req: AuthedRequest<z.infer<typeof detachSchema>>,
    res,
  ) => {
    try {
      const { unit_id, paymentMethodId } = req.body;
      // Owner only
      interface UnitOwner {
        user_id: string;
      }
      const { data: unit } = await supabaseService
        .from<UnitOwner>('units')
        .select('user_id')
        .eq('id', unit_id)
        .single();
      if (!unit || unit.user_id !== req.user!.id)
        return res
          .status(403)
          .json({ ok: false, error: { code: 'FORBIDDEN' } });
      await stripe.paymentMethods.detach(paymentMethodId);
      return res.json({ ok: true });
    } catch (e: any) {
      return res
        .status(500)
        .json({ ok: false, error: { code: 'INTERNAL', message: e?.message || 'server error' } });
    }
  },
);

// POST /payments/autopay/set { unit_id, enabled }
const autopaySchema = z.object({ unit_id: z.coerce.number(), enabled: z.coerce.boolean() });
rrouter.post(
  '/autopay/set',
  validateBody(autopaySchema),
  async (
    req: AuthedRequest<z.infer<typeof autopaySchema>>,
    res,
  ) => {
    try {
      const { unit_id, enabled } = req.body;
      // Owner only
      interface UnitOwner {
        user_id: string;
      }
      const { data: unit } = await supabaseService
        .from<UnitOwner>('units')
        .select('user_id')
        .eq('id', unit_id)
        .single();
      if (!unit || unit.user_id !== req.user!.id)
        return res
          .status(403)
          .json({ ok: false, error: { code: 'FORBIDDEN' } });
      await supabaseService
        .from('units')
        .update({ autopay_enabled: enabled })
        .eq('id', unit_id);
      return res.json({ ok: true });
    } catch (e: any) {
      return res
        .status(500)
        .json({ ok: false, error: { code: 'INTERNAL', message: e?.message || 'server error' } });
    }
  },
);

export default router;
