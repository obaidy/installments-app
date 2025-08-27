Environment Variables

- EXPO_PUBLIC_SUPABASE_URL: Supabase project URL.
- EXPO_PUBLIC_SUPABASE_ANON_KEY: Supabase anon key for client access.
- EXPO_PUBLIC_API_URL: Base URL of the Express API (e.g., http://localhost:3001).
- STRIPE_SECRET_KEY: Stripe secret key used by server and scripts.
- STRIPE_WEBHOOK_SECRET: Stripe webhook signing secret for /payments/webhook.
- APP_BASE_URL: Optional base URL used by the app for deep links.
- USE_QI: Set to 1 to enable Qi gateway instead of Stripe.
- QI_BASE: Qi API base URL (default https://api.qi.iq).
- QI_MERCHANT_ID: Merchant identifier provided by Qi.
- QI_PUBLIC_KEY_ID: Public key ID registered with Qi for HTTP Signatures.
- QI_PRIVATE_KEY: RSA private key (single-line with \n escapes) for signing.
- QI_PRIVATE_KEY_PATH: Path to a PEM file with the RSA private key.

Notes

- Provide either QI_PRIVATE_KEY or QI_PRIVATE_KEY_PATH when USE_QI=1.
- Do not expose STRIPE_SECRET_KEY in the mobile app; it is used only in server and Node scripts.
