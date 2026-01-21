"use client";
import { useEffect, useMemo, useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = typeof window !== 'undefined' ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '') : null;

export default function PayLinkPage({ params }: { params: { token: string } }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/payments/paylink/${params.token}`);
        const d = await r.json();
        if (!d?.ok) setError(d?.error || 'not found'); else setData(d.data);
      } catch (e: any) {
        setError(e?.message || 'failed');
      } finally { setLoading(false); }
    })();
  }, [API, params.token]);

  const options = useMemo(() => ({ appearance: { theme: 'stripe' as const } }), []);

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 bg-card text-card-foreground p-6 rounded-lg shadow-card">
        <h1 className="text-xl font-semibold">Pay Link</h1>
        {loading ? <p>Loading…</p> : error ? <p className="text-red-600">{error}</p> : (
          stripePromise ? (
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm data={data} email={email} setEmail={setEmail} api={API} setError={setError} token={params.token} />
            </Elements>
          ) : (
            <p>Stripe not configured</p>
          )
        )}
      </div>
    </main>
  );
}

function CheckoutForm({ data, email, setEmail, api, setError, token }: { data: any; email: string; setEmail: (s: string) => void; api: string; setError: (s: string|null) => void; token: string }) {
  const stripe = useStripe();
  const elements = useElements();
  async function handlePay() {
    setError(null);
    try {
      if (!email) { setError('email required'); return; }
      if (!data) return;
      if (!stripe || !elements) { setError('Stripe not ready'); return; }
      const card = elements.getElement(CardElement);
      if (!card) { setError('No card'); return; }
      const pmRes = await stripe.createPaymentMethod({ type: 'card', card, billing_details: { email } });
      if (pmRes.error || !pmRes.paymentMethod?.id) { setError(pmRes.error?.message || 'Card error'); return; }
      const body: any = { unitId: data.unit_id, email, paymentMethodId: pmRes.paymentMethod.id, paylinkToken: token };
      if (data.target_type === 'installment') body.installmentId = data.target_id;
      else if (data.target_type === 'service_fee') body.serviceFeeId = data.target_id;
      else if (data.target_type === 'batch') { setError('Batch links not supported in web demo'); return; }
      const r = await fetch(`${api}/payments/checkout`, { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok || d?.error) { setError(d?.error || 'failed'); return; }
      alert('Payment started or completed. You can close this page.');
    } catch (e: any) { setError(e?.message || 'failed'); }
  }
  return (
    <>
      <div className="text-sm">Unit: {data?.unit_id}</div>
      <div className="text-sm">Target: {data?.target_type} {data?.target_id || ''}</div>
      <div className="text-sm">Amount (optional): {data?.amount || '—'}</div>
      <div className="space-y-2">
        <label className="text-sm">Payer Email</label>
        <input className="w-full rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-ring" type="email" value={email} onChange={(e)=>setEmail(e.currentTarget.value)} placeholder="name@example.com" />
      </div>
      <div className="rounded-md border border-border p-3 bg-background">
        <CardElement options={{ hidePostalCode: true }} />
      </div>
      <button className="h-9 w-full rounded-md bg-primary text-primary-foreground px-4" onClick={handlePay} disabled={!stripe}>Pay</button>
    </>
  );
}
