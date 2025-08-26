import Stripe from 'stripe';

// Use the server-only key for backend scripts
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export async function createOrRetrieveCustomer(
  email: string,
): Promise<Stripe.Customer> {
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
export async function attachDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string,
) {
  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });
}

export async function chargeCustomer(
  customerId: string,
  amount: number,
  metadata: Record<string, any> = {},
) {
  return stripe.paymentIntents.create({
    customer: customerId,
    amount,
    currency: 'usd',
    metadata,
    confirm: true,
    automatic_payment_methods: { enabled: true },
  });
}
