import 'dotenv/config';
import express, { RequestHandler } from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import {
  createOrRetrieveCustomer,
  storeCard,
  chargeCustomer,
  stripe,
} from '../lib/stripeClient';
import { supabase } from '../lib/supabaseClient';

export const app = express();
app.use(cors());

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
    const unitId = Number(intent.metadata.unit_id);
    const installmentId = Number(intent.metadata.installment_id);
    const amount = intent.amount_received || intent.amount;

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

  res.json({ received: true });
};

app.post('/payments/webhook', express.raw({ type: 'application/json' }), webhookHandler);

app.use(express.json());

export const checkoutHandler: RequestHandler = async (req, res) => {
  const { email, unitId, installmentId, paymentMethodId, amountInCents } = req.body;
  if (!email || !unitId || !installmentId) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }

  try {
    let amount = amountInCents as number | undefined;
    if (!amount) {
      const { data, error } = await supabase
        .from('installments')
        .select('amount')
        .eq('id', installmentId)
        .single();
      if (error || !data) throw new Error('Installment not found');
      amount = Math.round((data.amount as number) * 100);
    }

    const customer = await createOrRetrieveCustomer(email);
    const pm = paymentMethodId || 'pm_card_visa';
    await storeCard(customer.id, pm);
    const intent = await chargeCustomer(customer.id, amount, {
      unit_id: unitId,
      installment_id: installmentId,
    });

    await supabase.from('payments').insert({
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


    res.json({ status: intent.status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.post('/payments/checkout', checkoutHandler);

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () =>
    console.log(`API server listening on port ${PORT}`),
  );
}

export default app;