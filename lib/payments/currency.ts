const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();
const STRIPE_CURRENCY_DECIMALS = Number(
  process.env.STRIPE_CURRENCY_DECIMALS || (STRIPE_CURRENCY === 'jpy' ? 0 : 2)
);
const IQD_TO_STRIPE_RATE = Number(process.env.IQD_TO_STRIPE_RATE || 1);

export function toStripeMinor(amountIQD: number) {
  const base = Number(amountIQD || 0) * IQD_TO_STRIPE_RATE;
  return Math.round(base * Math.pow(10, STRIPE_CURRENCY_DECIMALS));
}

export function fromStripeMinor(amountMinor: number) {
  const base = Number(amountMinor || 0) / Math.pow(10, STRIPE_CURRENCY_DECIMALS);
  return base / IQD_TO_STRIPE_RATE;
}

export function getStripeCurrency() {
  return STRIPE_CURRENCY;
}
