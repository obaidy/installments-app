import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '../Config';

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

export async function createOrRetrieveCustomer(email: string): Promise<Stripe.Customer> {
  const customers = await stripe.customers.list({ email, limit: 1 });
  if (customers.data.length > 0) return customers.data[0];
  return stripe.customers.create({ email });
}

export async function storeCard(customerId: string, paymentMethodId: string) {
  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });
}

export async function chargeCustomer(customerId: string, amount: number, metadata: Record<string, any> = {}) {
  return stripe.paymentIntents.create({
    customer: customerId,
    amount,
    currency: 'usd',
    metadata,
    confirm: true,
    automatic_payment_methods: { enabled: true },
  });
}