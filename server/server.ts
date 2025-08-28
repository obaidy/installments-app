import 'dotenv/config';
import express, { RequestHandler } from 'express';
import cors from 'cors';
import Stripe from 'stripe';

// We'll construct a Stripe client lazily for webhook verification to avoid requiring env on import.
import { supabase } from '../lib/supabaseClient';

// ⬇️ New: unified payments router (provides /payments/checkout and /payments/status/:ref)
import paymentsRouter from './routes/payments';

export const app = express();
app.use(cors());

function mapStripeStatus(
  status: string,
): 'paid' | 'pending' | 'failed' | 'cancelled' {
  switch (status) {
    case 'succeeded':
      return 'paid';
    case 'processing':
      return 'pending';
    case 'requires_payment_method':
      return 'failed';
    case 'canceled':
      return 'cancelled';
    default:
      return 'pending';
  }
}

/**
 * IMPORTANT: Stripe webhook must use raw body and be registered
 * BEFORE express.json(), otherwise signature verification fails.
 */
export const webhookHandler: RequestHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const secret = process.env.STRIPE_WEBHOOK_SECRET as string;
  if (!sig || !secret) {
    res.status(400).json({ error: 'Missing webhook signature' });
    return;
  }

  let event: Stripe.Event;
  try {
    // Verify webhook without needing a client instance
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', { apiVersion: '2022-11-15' as any });
    event = stripe.webhooks.constructEvent(req.body as any, sig, secret);

  } catch (err: any) {
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
    return;
  }

  if (event.type.startsWith('payment_intent')) {
    const intent = event.data.object as Stripe.PaymentIntent;

    // Safely read metadata (may be undefined)
    const unitId = intent.metadata?.unit_id
      ? Number(intent.metadata.unit_id)
      : undefined;
    const installmentId = intent.metadata?.installment_id
      ? Number(intent.metadata.installment_id)
      : undefined;
    const serviceFeeId = intent.metadata?.service_fee_id
      ? Number(intent.metadata.service_fee_id)
      : undefined;
    const amount = intent.amount_received ?? intent.amount ?? 0;
    const status = mapStripeStatus(intent.status);

    // Upsert payment row if we have linkage data
    if (unitId && (installmentId || serviceFeeId)) {
      await supabase.from('payments').upsert({
        unit_id: unitId,
        installment_id: installmentId,
        service_fee_id: serviceFeeId,
        amount: amount / 100,
        status,
        paid_at: status === 'paid' ? new Date().toISOString() : null,
      });

      if (status === 'paid') {
        if (installmentId) {
          await supabase
            .from('installments')
            .update({
              paid: true,
              paid_at: new Date().toISOString(),
            })
            .eq('id', installmentId);
        } else if (serviceFeeId) {
          await supabase
            .from('service_fees')
            .update({
              paid: true,
              paid_at: new Date().toISOString(),
            })
            .eq('id', serviceFeeId);
        }
      }
    }
  }

  res.json({ received: true });
};

// Stripe webhook endpoint (raw body parser)
app.post('/payments/webhook', express.raw({ type: 'application/json' }), webhookHandler);

// JSON parser for all other routes AFTER webhook
app.use(express.json());

// ⬇️ Mount the new unified router (Stripe now; flip USE_QI=1 later)
app.use('/payments', paymentsRouter);

// Simple health check
app.get('/healthz', (_req, res) => res.json({ ok: true }));

export function startServer() {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

export default app;
