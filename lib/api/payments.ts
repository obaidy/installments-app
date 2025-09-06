import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { API_BASE } from '../config';


export async function createCheckout(
  amountIQD: number,
  description?: string,
  metadata?: Record<string, string>,
  target?: { type: 'installment' | 'service_fee'; id: number }
) {
const returnUrl = Linking.createURL('/(client)/payments/return');
const r = await fetch(`${API_BASE}/payments/checkout`, {
method: 'POST', headers: { 'content-type': 'application/json' },
body: JSON.stringify({
  amountIQD,
  description,
  metadata,
  returnUrl,
  target_type: target?.type,
  target_id: target?.id,
  // Provide server-friendly fields when available
  unitId: metadata?.unit_id ? Number(metadata.unit_id) : undefined,
  installmentId: target?.type === 'installment' ? target.id : undefined,
  serviceFeeId: target?.type === 'service_fee' ? target.id : undefined,
})
});
const data = await r.json();
if (!r.ok) throw new Error(data?.error || 'Payment error');
if (data.redirectUrl) {
// Open hosted page (Qi)
await WebBrowser.openBrowserAsync(data.redirectUrl);
}
return data as { ok: true; redirectUrl?: string; referenceId?: string };
}


export async function getPaymentStatus(referenceId: string) {
const r = await fetch(`${API_BASE}/payments/status/${referenceId}`);
const d = await r.json();
return d.status as 'pending' | 'paid' | 'failed' | 'cancelled';
}

export async function createBatchCheckout(
  unitId: number,
  items: Array<{ type: 'installment' | 'service_fee'; id: number }> ,
  email?: string,
) {
  const r = await fetch(`${API_BASE}/payments/checkout-batch`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ unitId, items, email }),
  });
  const d = await r.json();
  if (!r.ok || !d?.ok) throw new Error(d?.error || 'Batch payment error');
  return d as { ok: true; referenceId: string };
}
