import Stripe from "stripe";
import { getStripeCurrency, toStripeMinor } from "../../lib/payments/currency";


export type PaymentIntentPayload = {
  amountIQD: number;
  description?: string;
  metadata?: Record<string, string>;
  customerId?: string;
  returnUrl?: string;
  idempotencyKey?: string;
};


export type PaymentGateway = {
  createIntent(p: PaymentIntentPayload): Promise<{ ok: true; redirectUrl?: string; referenceId?: string } | { ok: false; error: string }>;
  getStatus(referenceId: string): Promise<'pending' | 'paid' | 'failed' | 'cancelled'>;
  refund(referenceId: string, amountIQD?: number): Promise<boolean>;
};


export function makeStripeGateway(secretKey: string): PaymentGateway {
const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" as any });


return {
async createIntent(p) {
const cents = toStripeMinor(p.amountIQD || 0);
const pi = await stripe.paymentIntents.create({
  amount: cents,
  currency: getStripeCurrency(),
  description: p.description,
  metadata: p.metadata,
  automatic_payment_methods: { enabled: true },
}, p.idempotencyKey ? { idempotencyKey: p.idempotencyKey } : undefined as any);
return { ok: true as const, referenceId: pi.id };
},


async getStatus(referenceId) {
    const pi = await stripe.paymentIntents.retrieve(referenceId);
    if (pi.status === 'succeeded') return 'paid';
    if (pi.status === 'processing') return 'pending';
    if (pi.status === 'canceled') return 'cancelled';
    if (pi.status === 'requires_payment_method') return 'failed';
    return 'pending';
  },


async refund(referenceId) {
await stripe.refunds.create({ payment_intent: referenceId });
return true;
},
};
}
