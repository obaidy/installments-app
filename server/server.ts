import 'dotenv/config';
import express, { RequestHandler } from 'express';
import cors from 'cors';
import Stripe from 'stripe';

// Keep your existing Stripe client import for webhook verification
import { stripe } from '../lib/stripeClient';
import { supabase } from '../lib/supabaseClient';

// ⬇️ New: unified payments router (provides /payments/checkout and /payments/status/:ref)
import paymentsRouter from './routes/payments'; 

export const app = express();
app.use(cors());

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
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err: any) {
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
    return;
  }

  if (event.type.startsWith('payment_intent')) {
    const intent = event.data.object as Stripe.PaymentIntent;

    // Safely read metadata (may be undefined)
    const unitId = intent.metadata?.unit_id ? Number(intent.metadata.unit_id) : undefined;
    const installmentId = intent.metadata?.installment_id ? Number(intent.metadata.installment_id) : undefined;

    const amount = (intent.amount_received ?? intent.amount ?? 0);

    // Upsert payment row if we have linkage data
    if (unitId && installmentId) {
      await supabase.from('payments').upsert({
        unit_id: unitId,
        installment_id: installmentId,
        amount: amount / 100,
        status: intent.status,
        paid_at: intent.status === 'succeeded' ? new Date().toISOString() : null,
      });

      if (intent.status === 'succeeded') {
        await supabase
          .from('installments')
          .update({ paid: true })
          .eq('id', installmentId);
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

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

export default app;
