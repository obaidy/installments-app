// Lightweight types shared by app code
export type PaymentIntentPayload = {
amountIQD: number;
description?: string;
metadata?: Record<string, string>;
customerId?: string;
returnUrl?: string; // app deep link
};


export type PaymentResult =
| { ok: true; redirectUrl?: string; referenceId?: string }
| { ok: false; error: string };