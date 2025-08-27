import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { API_BASE } from '../config';


export async function createCheckout(amountIQD: number, description?: string, metadata?: Record<string,string>) {
const returnUrl = Linking.createURL('/(client)/payments/return');
const r = await fetch(`${API_BASE}/payments/checkout`, {
method: 'POST', headers: { 'content-type': 'application/json' },
body: JSON.stringify({ amountIQD, description, metadata, returnUrl })
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