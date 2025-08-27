Payments API

Base URL: `${EXPO_PUBLIC_API_URL}` (default http://localhost:3001)

POST /payments/checkout

- Body: { amountIQD: number; description?: string; returnUrl?: string; metadata?: Record<string,string> }
- Response (Stripe): { ok: true, referenceId: string }
- Response (Qi): { ok: true, referenceId: string, redirectUrl: string }
- Errors: { ok: false, error: string } or HTTP 400/500 with { error }

GET /payments/status/:ref

- Response: { status: 'pending' | 'paid' | 'failed' | 'cancelled' }

POST /payments/webhook

- Stripe webhook endpoint. Uses raw body for signature verification.
- Set STRIPE_WEBHOOK_SECRET and configure Stripe to send events here.

GET /healthz

- Simple health check endpoint returning { ok: true }.

Notes

- Gateway selection: Stripe by default; set USE_QI=1 for Qi. Checkout response includes a hosted payment page URL (redirectUrl) when using Qi.
- The backend updates Supabase payment and installment records upon successful events (webhook for Stripe; status polling for Qi).
