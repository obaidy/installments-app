Architecture Overview

Mobile (Expo/React Native)

- Routing: `app/` uses Expo Router with segments for client and admin `(web)`.
- State/queries: `@tanstack/react-query` for data fetching and caching.
- Auth/data: Supabase client in `lib/supabaseClient.ts`.
- Payments: `lib/api/payments.ts` calls the backend for checkout and status.
- UI: shared components and hooks under `components/` and `hooks/`.

Backend (Node/Express)

- Entry: `server/server.ts` sets up CORS, JSON parsing, webhook route, and `/payments` router.
- Routes: `server/routes/payments.ts` exposes `POST /checkout` and `GET /status/:ref`.
- Gateways: `server/payments/stripeGateway.ts` and `server/payments/qiGateway.ts` behind a common interface; pick via `USE_QI`.
- Webhook: `/payments/webhook` handles Stripe events using `stripe.webhooks.constructEvent` and updates Supabase.

Data Model (Supabase)

- Core tables: `user_roles`, `user_complexes`, `complexes`, `units`, `installments`, `service_fees`, `payments` (+ optional `subscriptions`).
- RLS: policies restrict access by role and relation; see README for expectations.

Background Jobs

- `scripts/schedule-charges.ts` charges due installments and reconciles results to `payments` and `installments` tables. Intended for cron.
