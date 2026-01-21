Payments API

Base URL: `${EXPO_PUBLIC_API_URL}` (default http://localhost:3001)

Auth

- User endpoints require `Authorization: Bearer <supabase access token>`.
- Admin endpoints are protected by role checks in Supabase.
- Idempotency: send `Idempotency-Key` header or `idempotencyKey` in body for checkout endpoints.

Checkout

POST /payments/checkout

- Body:
  - unitId: number
  - installmentId?: number
  - serviceFeeId?: number
  - target_type?: 'installment' | 'service_fee'
  - target_id?: number
  - amountIQD?: number
  - amountInCents?: number (Stripe minor units override)
  - email?: string (required for Stripe)
  - paymentMethodId?: string
  - returnUrl?: string (Qi)
  - description?: string
  - metadata?: Record<string,string>
  - paylinkToken?: string
  - idempotencyKey?: string
- Response (Stripe): { ok: true, status: 'paid'|'pending'|'failed'|'cancelled', referenceId: string, client_secret?: string }
- Response (Qi): { ok: true, referenceId: string, redirectUrl: string }
- Errors: { error } with 4xx/5xx

POST /payments/checkout-batch

- Body: { unitId: number, items: Array<{ type: 'installment'|'service_fee', id: number }>, email?: string, idempotencyKey?: string }
- Response: { ok: true, referenceId: string }
- Auth required. (Batch checkout is Stripe-only.)

GET /payments/status/:ref

- Response: { status: 'pending' | 'paid' | 'failed' | 'cancelled' }

Payment Methods (Stripe)

POST /payments/pm/setup-intent

- Body: { unit_id: number }
- Response: { ok: true, clientSecret: string }

POST /payments/pm/set-default

- Body: { unit_id: number; paymentMethodId: string }
- Response: { ok: true }

GET /payments/pm/list?unit_id=123

- Response: { ok: true, paymentMethods: Array<{ id: string; card?: { brand: string; last4: string; exp_month: number; exp_year: number } }> }

POST /payments/pm/detach

- Body: { paymentMethodId: string }
- Response: { ok: true }

Wallet

GET /payments/wallet/balance

- Response: { ok: true, balance: number }

POST /payments/wallet/topup

- Body: { amountIQD?: number; amountInCents?: number }
- Response: { ok: true, status: 'paid'|'pending'|'failed'|'cancelled' }

POST /payments/wallet/apply

- Body: { unitId?: number }
- Response: { ok: true, applied: number, remaining: number }

Autopay

POST /payments/autopay/set

- Body: { unit_id: number; enabled: boolean }
- Response: { ok: true }

Paylinks

POST /payments/paylink/create

- Body: { unit_id: number; target_type: 'installment'|'service_fee'|'batch'; target_id?: number; amount?: number; expires_in_minutes?: number }
- Response: { ok: true, token: string, url: string }

GET /payments/paylink/:token

- Response: { ok: true, data: { ... } }

GET /payments/receipt/:id

- Response: { ok: true, receipt: { ... }, verify: string }

Auth

GET /auth/me

- Response: { user: { id, email } | null, role: string | null, status: string | null }

GET /auth/ping

- Response: { ok: true, auth: 'user' }

GET /auth/admin/ping

- Response: { ok: true, auth: 'admin' }

Webhook

POST /payments/webhook

- Stripe webhook endpoint. Uses raw body for signature verification.
- Set STRIPE_WEBHOOK_SECRET and configure Stripe to send events here.

Health

GET /health

- Simple health check endpoint returning { ok: true, uptime: number }.

Notes

- Gateway selection: Stripe by default; set USE_QI=1 for Qi. Checkout response includes a hosted payment page URL (redirectUrl) when using Qi.
- The backend updates Supabase payment and installment records upon successful events (webhook for Stripe; status polling for Qi).
