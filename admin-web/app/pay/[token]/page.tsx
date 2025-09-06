"use client";
import { useEffect, useState } from 'react';

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

  async function handlePay() {
    setError(null);
    try {
      if (!email) { setError('email required'); return; }
      if (!data) return;
      const body: any = { unitId: data.unit_id, email };
      if (data.target_type === 'installment') body.installmentId = data.target_id;
      else if (data.target_type === 'service_fee') body.serviceFeeId = data.target_id;
      else if (data.target_type === 'batch') {
        setError('Batch links not supported in web demo'); return;
      }
      const r = await fetch(`${API}/payments/checkout`, { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok || !d?.ok) setError(d?.error || 'failed');
      else alert('Payment started. Check your email for confirmation.');
    } catch (e: any) { setError(e?.message || 'failed'); }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 bg-card text-card-foreground p-6 rounded-lg shadow-card">
        <h1 className="text-xl font-semibold">Pay Link</h1>
        {loading ? <p>Loading…</p> : error ? <p className="text-red-600">{error}</p> : (
          <>
            <div className="text-sm">Unit: {data?.unit_id}</div>
            <div className="text-sm">Target: {data?.target_type} {data?.target_id || ''}</div>
            <div className="text-sm">Amount (optional): {data?.amount || '—'}</div>
            <div className="space-y-2">
              <label className="text-sm">Payer Email</label>
              <input className="w-full rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-ring" type="email" value={email} onChange={(e)=>setEmail(e.currentTarget.value)} placeholder="name@example.com" />
            </div>
            <button className="h-9 w-full rounded-md bg-primary text-primary-foreground px-4" onClick={handlePay}>Pay</button>
          </>
        )}
      </div>
    </main>
  );
}

