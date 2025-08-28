import express from "express";
import { makeStripeGateway } from "../payments/stripeGateway";
import { makeQiGateway } from "../payments/qiGateway";
import { supabaseService } from "../../lib/supabaseServiceClient";


const router = express.Router();


const useQi = process.env.USE_QI === "1";
const stripeSecret = process.env.STRIPE_SECRET_KEY || "";


const gateway = useQi ? makeQiGateway() : makeStripeGateway(stripeSecret);


// POST /payments/checkout
router.post("/checkout", async (req, res) => {
try {
const { amountIQD, description, returnUrl, metadata, target_type, target_id } = req.body || {};
if (!amountIQD || amountIQD <= 0) {
return res.status(400).json({ ok: false, error: "amountIQD required" });
}
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

const result = await gateway.createIntent({ amountIQD, description, returnUrl, metadata });

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
res.status(500).json({ ok: false, error: e?.message || "server error" });
}
});


// GET /payments/status/:ref
router.get("/status/:ref", async (req, res) => {
try {
const status = await gateway.getStatus(req.params.ref);
res.json({ status });
} catch (e: any) {
res.status(500).json({ error: e?.message || "server error" });
}
});


export default router;
