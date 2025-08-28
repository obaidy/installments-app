# Installments App

End-to-end installments management app built with Expo (React Native) and a lightweight Node/Express backend. It integrates Supabase for auth/data and supports payments via Stripe or a Qi-style provider.

## Quick Start

- Node: use `nvm use` (Node 18). Expo SDK 53 supports Node 18/20.
- Install: `npm install`
- Env: `cp .env.example .env` and fill values (see docs/ENV.md)
- Mobile: `npx expo start` (choose iOS/Android/Web)
- API: `npm run start-server` (default `http://localhost:3001`)

Set `EXPO_PUBLIC_API_URL` in `.env` so the app can reach the API.

## Features

- Auth and roles via Supabase
- Admin dashboard for complexes, users, and units
- Client flows for viewing installments and paying
- Payments via Stripe or Qi (toggle with `USE_QI`)
- Webhook handling to reconcile payments and update records
- Scheduled charges script for due installments

## Project Structure

- `app/`: Expo Router screens (client + manager). Admin now lives in `admin-web/`.
- `components/`, `hooks/`, `lib/`: shared UI and utilities
- `server/`: Express server, payments routes, and gateways
- `scripts/`: maintenance/cron scripts (e.g., `schedule-charges.ts`)
- `__tests__/`: unit/integration tests

## Environment

See `docs/ENV.md` for all variables. Common ones:

- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_URL` (e.g., `http://localhost:3001`)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `USE_QI=1` to switch to Qi; also see `QI_*` vars

Copy `.env.example` and adjust values for your environment.

## Running

- App: `npx expo start`
- API: `npm run start-server`

The mobile app calls the API at `${EXPO_PUBLIC_API_URL}` under `/payments/*`.

## Payments

Backend exposes a unified payments API with two gateways:

- Stripe: default; requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
- Qi: set `USE_QI=1` and configure `QI_*` variables

Endpoints and request/response examples are documented in `docs/API.md`.

Webhook: configure Stripe to send events to `/payments/webhook`. The handler verifies the signature using `STRIPE_WEBHOOK_SECRET` and updates Supabase records accordingly.

Scheduled charges: `npm run schedule-charges` charges due installments and marks records. Run via cron if needed.

## Supabase Schema

This app expects tables for `user_roles`, `user_complexes`, `complexes`, `units`, `installments`, `service_fees`, `payments`, and optionally `subscriptions` with appropriate foreign keys and RLS.

Note: SQL files are not included in this repo. Create the schema and RLS policies in your Supabase project following the table names above. If you previously created older versions, drop or migrate them before applying an updated schema.

## Admin Pages

Admin UI lives in `admin-web/` (Next.js app). The mobile app routes admins to a WebView (`/admin-web`) which SSO-authenticates into `admin-web`.

## Scripts

- `npm run start-server`: start Express API on port 3001
- `npm run schedule-charges`: charge due installments via Stripe
- `npm run reset-project`: reset example app scaffolding

## Development

- Lint: `npm run lint`
- Tests: `npm test`
- TypeScript: enabled across mobile + server

For more, see `docs/ARCHITECTURE.md` and `CONTRIBUTING.md`.
