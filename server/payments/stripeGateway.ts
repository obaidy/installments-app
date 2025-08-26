import Stripe from "stripe";


export type PaymentIntentPayload = {
amountIQD: number;
description?: string;
metadata?: Record<string, string>;
customerId?: string;
returnUrl?: string;
};


export type PaymentGateway = {
createIntent(p: PaymentIntentPayload): Promise<{ ok: true; redirectUrl?: string; referenceId?: string } | { ok: false; error: string }>;
getStatus(referenceId: string): Promise<"pending" | "succeeded" | "failed" | "canceled">;
refund(referenceId: string, amountIQD?: number): Promise<boolean>;
};


export function makeStripeGateway(secretKey: string): PaymentGateway {
const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" as any });


return {
async createIntent(p) {
// For testing we use USD cents; when moving to IQD in Stripe (if supported), adjust mapping
const cents = Math.round((p.amountIQD || 0) * 100);
const pi = await stripe.paymentIntents.create({
amount: cents,
currency: "usd",
description: p.description,
metadata: p.metadata,
automatic_payment_methods: { enabled: true },
});
return { ok: true as const, referenceId: pi.id };
},


async getStatus(referenceId) {
const pi = await stripe.paymentIntents.retrieve(referenceId);
if (pi.status === "succeeded") return "succeeded";
if (pi.status === "canceled") return "canceled";
if (pi.status === "requires_payment_method") return "failed";
return "pending";
},


async refund(referenceId) {
await stripe.refunds.create({ payment_intent: referenceId });
return true;
},
};
}