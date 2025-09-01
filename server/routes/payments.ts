import express from "express";
import { z } from "zod";
import { validateBody, validateParams } from "../utils/validate";
import { requireAuth, assertUnitAccess, AuthedRequest } from "../middleware/auth";
import { TypedRequest } from "../types";
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
router.post(
  "/checkout",
  validateBody(checkoutSchema),
  async (
    req: TypedRequest<z.infer<typeof checkoutSchema>>,
    res,
  ) => {
    try {
      const {
        amountIQD: amt,
        description,
        returnUrl,
        metadata,
        target_type,
        target_id,
      } = req.body;
      const idempotencyKey =
        (req.headers["x-idempotency-key"] as string | undefined) ||
        undefined;
      // Resolve unit_id from target if provided
      let unitId: number | undefined = undefined;
      if (target_type && target_id) {
        interface UnitIdRow {
          unit_id: number | null;
        }
        if (target_type === "installment" || target_type === "installments") {
          const { data } = await supabaseService
            .from<UnitIdRow>("installments")
            .select("unit_id")
            .eq("id", target_id)
            .single();
          unitId = data?.unit_id ?? undefined;
        } else if (
          target_type === "service_fee" ||
          target_type === "service_fees"
        ) {
          const { data } = await supabaseService
            .from<UnitIdRow>("service_fees")
            .select("unit_id")
            .eq("id", target_id)
            .single();
          unitId = data?.unit_id ?? undefined;
        }
      }
      // Record payment_intent row (created)
      let intentId: string | undefined;
      if (target_type && target_id) {
        interface PaymentIntentRow {
          id: string;
        }
        const { data: intent } = await supabaseService
          .from<PaymentIntentRow>("payment_intents")
          .insert({
            unit_id: unitId,
            target_type:
              target_type === "service_fee" ? "service_fee" : "installment",
            target_id,
            amount: amt,
            status: "created",
            return_url: returnUrl || null,
          })
          .select("id")
          .single();
        intentId = intent?.id;
      }

      const result = await gateway.createIntent({
        amountIQD: amt,
        description,
        returnUrl,
        metadata,
        idempotencyKey,
      });

      // Update intent with provider ref if known
      try {
        const ref =
          (result as any).referenceId ||
          (result as any).id ||
          (result as any).providerRef;
        if (intentId && ref) {
          await supabaseService
            .from("payment_intents")
            .update({
              provider: useQi ? "qi" : "stripe",
              provider_ref: ref,
              status: "processing",
            })
            .eq("id", intentId);
        }
      } catch {}
      res.status(result.ok ? 200 : 400).json(result);
    } catch (e: any) {
      res.status(500).json({
        ok: false,
        error: { code: "INTERNAL", message: e?.message || "server error" },
      });
    }
  },
);

// GET /payments/status/:ref
router.get(
  "/status/:ref",
  validateParams(statusSchema),
  async (
    req: TypedRequest<unknown, z.infer<typeof statusSchema>>,
    res,
  ) => {
    try {
      const status = await gateway.getStatus(req.params.ref);
      res.json({ status });
    } catch (e: any) {
      res.status(500).json({
        ok: false,
        error: { code: "INTERNAL", message: e?.message || "server error" },
      });
    }
  },
);

// POST /payments/charge-now { unit_id }
const chargeNowSchema = z.object({ unit_id: z.coerce.number() });
router.post(
  '/charge-now',
  requireAuth(),
  validateBody(chargeNowSchema),
  async (
    req: AuthedRequest<z.infer<typeof chargeNowSchema>>,
    res,
  ) => {
    try {
      const { unit_id } = req.body;
      // allow admins/accountants or managers/owners via assertUnitAccess
      interface UserRoleRow {
        role: string | null;
      }
      const { data: roleRow } = await supabaseService
        .from<UserRoleRow>('user_roles')
        .select('role')
        .eq('user_id', req.user!.id)
        .single();
      const role = roleRow?.role;
      const allowed =
        role === 'admin' ||
        role === 'accountant' ||
        (await assertUnitAccess(req.user!.id, unit_id));
      if (!allowed)
        return res
          .status(403)
          .json({ ok: false, error: { code: 'FORBIDDEN' } });

      // find earliest due unpaid installment for unit
      interface InstallmentRow {
        id: number;
        unit_id: number;
        amount_iqd: number;
        paid: boolean;
        due_date: string;
        units: { customer_id: string | null } | null;
      }
      const { data: inst } = await supabaseService
        .from<InstallmentRow>('installments')
        .select(
          'id, unit_id, amount_iqd, paid, due_date, units(customer_id)',
        )
        .eq('unit_id', unit_id)
        .eq('paid', false)
        .lte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!inst)
        return res
          .status(404)
          .json({ ok: false, error: { code: 'NOTHING_TO_CHARGE' } });
      const customerId = inst.units?.customer_id;
      if (!customerId)
        return res
          .status(400)
          .json({ ok: false, error: { code: 'NO_CUSTOMER' } });
      const amountCents = Math.round(inst.amount_iqd * 100);
      const intent = await chargeCustomer(customerId, amountCents, {
        unit_id,
        installment_id: inst.id,
      });
      return res.json({
        ok: true,
        payment_intent: { id: intent.id, status: intent.status },
      });
    } catch (e: any) {
      return res.status(500).json({
        ok: false,
        error: { code: 'INTERNAL', message: e?.message || 'server error' },
      });
    }
  },
);


export default router;
