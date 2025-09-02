import { Router } from 'express';
import { createOrRetrieveCustomer, storeCard, stripe } from '../../lib/stripeClient';
import { requireUser, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /payment-methods/save
 * Body: { email?: string, paymentMethodId: string }
 */
router.post('/save', requireUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { email: emailRaw, paymentMethodId } = req.body ?? {};
    if (!paymentMethodId) return res.status(400).json({ error: 'paymentMethodId required' });

    const email = (emailRaw as string) || req.user?.email || '';
    if (!email) return res.status(400).json({ error: 'email required' });

    const customer = await createOrRetrieveCustomer(email);
    await storeCard(customer.id, paymentMethodId);

    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    res.json({ ok: true, customer_id: customer.id, default_payment_method: paymentMethodId });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? 'internal error' });
  }
});

/**
 * GET /payment-methods/list?email=...
 */
router.get('/list', requireUser, async (req: AuthenticatedRequest, res) => {
  try {
    const email = (req.query.email as string) || req.user?.email || '';
    if (!email) return res.status(400).json({ error: 'email required' });

    const customer = await createOrRetrieveCustomer(email);
    const pms = await stripe.paymentMethods.list({ customer: customer.id, type: 'card' });
    res.json({ data: pms.data });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? 'internal error' });
  }
});

export default router;
