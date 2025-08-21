import 'dotenv/config';
import express, { RequestHandler } from 'express';
import cors from 'cors';
import { createOrRetrieveCustomer, storeCard, chargeCustomer } from '../lib/stripeClient';
import { supabase } from '../lib/supabaseClient';

  export const app = express();
app.use(cors());
app.use(express.json());

  export const checkoutHandler: RequestHandler = async (req, res, _next) => {
  const { email, unit } = req.body;
  if (!email || !unit) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const customer = await createOrRetrieveCustomer(email);
    const paymentMethod = 'pm_card_visa';
    await storeCard(customer.id, paymentMethod);
    const intent = await chargeCustomer(customer.id, 10000, { unit_id: unit });

    await supabase.from('payments').insert({
      unit_id: Number(unit),
      amount: 100,
      status: 'paid',
      paid_at: new Date().toISOString(),
    });

    res.json({ status: intent.status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.post('/payments/checkout', checkoutHandler);

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`API server listening on port ${PORT}`));
}

export default app;