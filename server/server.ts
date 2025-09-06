import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import type Stripe from 'stripe';

import { stripe } from '../lib/stripeClient';
import { supabase } from '../lib/supabaseServiceClient';

// Routers
import paymentMethodsRouter from './routes/paymentMethods';
import paymentsRouter from './routes/payments';
import reconcileRouter from './routes/reconcile';
import authRouter from './routes/auth';

const app = express();

// CORS first
app.use(cors());

// --- Stripe webhook MUST be before express.json() and use raw body ---
app.post(
  '/payments/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'] as string | undefined;
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!sig || !secret) {
        return res.status(400).json({ error: 'Missing webhook signature/secret' });
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, secret);
      } catch (err: any) {
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      if (event.type.startsWith('payment_intent.')) {
        const intent = event.data.object as Stripe.PaymentIntent;
        const unitId = Number(intent.metadata?.unit_id);
        const installmentId = Number(intent.metadata?.installment_id);
        const serviceFeeId = Number((intent.metadata as any)?.service_fee_id || 0);
        const amountCents = intent.amount_received || intent.amount || 0;

        if (unitId && (installmentId || serviceFeeId)) {
          const base: any = {
            unit_id: unitId,
            amount: amountCents / 100,
            status: intent.status as any,
            paid_at: intent.status === 'succeeded' ? new Date().toISOString() : null,
          };
          if (installmentId) base.installment_id = installmentId;
          if (serviceFeeId) base.service_fee_id = serviceFeeId;

          await supabase.from('payments').upsert(base as any);

          // Mark paid on success
          if (intent.status === 'succeeded') {
            if (installmentId) {
              await supabase
                .from('installments')
                .update({ paid: true, paid_at: new Date().toISOString() })
                .eq('id', installmentId);
            } else if (serviceFeeId) {
              await supabase
                .from('service_fees')
                .update({ paid: true, paid_at: new Date().toISOString() })
                .eq('id', serviceFeeId);
            }
          }
        }
      }

      return res.json({ received: true });
    } catch (e: any) {
      console.error('[webhook] error', e?.message || e);
      return res.status(500).json({ error: 'internal webhook error' });
    }
  }
);

// JSON body AFTER webhook
app.use(express.json());

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Friendly root endpoint
app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'installments-api',
    endpoints: ['/health', '/auth/*', '/payments/*', '/payment-methods/*', '/reconcile/*'],
  });
});

// Mount feature routers
app.use('/payment-methods', paymentMethodsRouter);
app.use('/payments', paymentsRouter);
app.use('/reconcile', reconcileRouter);
app.use('/auth', authRouter);

// Global error guard
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

// Start server
const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`✅ API server listening on http://localhost:${PORT}`);
});

export default app;
