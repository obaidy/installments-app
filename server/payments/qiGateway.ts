import fetch from "node-fetch";
import { buildQiHeaders } from "./qi/signature";


export type PaymentIntentPayload = {
amountIQD: number;
description?: string;
metadata?: Record<string, string>;
customerId?: string;
returnUrl?: string;
 idempotencyKey?: string;
};


type Status = 'pending' | 'paid' | 'failed' | 'cancelled';


export type PaymentGateway = {
createIntent(p: PaymentIntentPayload): Promise<{ ok: true; redirectUrl?: string; referenceId?: string } | { ok: false; error: string }>;
  getStatus(referenceId: string): Promise<Status>;
refund(referenceId: string, amountIQD?: number): Promise<boolean>;
};


const QI_BASE = process.env.QI_BASE || "https://api.qi.iq";
const QI_MERCHANT_ID = process.env.QI_MERCHANT_ID || "";
const QI_PUBLIC_KEY_ID = process.env.QI_PUBLIC_KEY_ID || "";


export function makeQiGateway(): PaymentGateway {
return {
async createIntent(p) {
const body = {
merchantId: QI_MERCHANT_ID,
amount: p.amountIQD,
currency: "IQD",
description: p.description || "Installment payment",
returnUrl: p.returnUrl,
metadata: p.metadata || {},
};
const headers = buildQiHeaders("POST", "/payments", body, QI_PUBLIC_KEY_ID);
const r = await fetch(`${QI_BASE}/payments`, { method: "POST", headers, body: JSON.stringify(body) });
if (!r.ok) return { ok: false as const, error: `Qi error ${r.status}` };
const d: any = await r.json();
return { ok: true as const, referenceId: d.paymentId, redirectUrl: d.formUrl };
},


async getStatus(referenceId) {
const headers = buildQiHeaders("GET", `/payments/${referenceId}/status`, undefined, QI_PUBLIC_KEY_ID);
const r = await fetch(`${QI_BASE}/payments/${referenceId}/status`, { headers });
const d: any = await r.json();
   const s = (d?.status || '').toUpperCase();
    if (s === 'APPROVED' || s === 'CONFIRMED') return 'paid';
    if (s === 'CANCELLED') return 'cancelled';
    if (s === 'DECLINED') return 'failed';
    return 'pending';
  },


async refund(referenceId, amountIQD) {
const body = { paymentId: referenceId, amount: amountIQD };
const headers = buildQiHeaders("POST", `/payments/${referenceId}/refund`, body, QI_PUBLIC_KEY_ID);
const r = await fetch(`${QI_BASE}/payments/${referenceId}/refund`, { method: "POST", headers, body: JSON.stringify(body) });
return r.ok;
},
};
}
