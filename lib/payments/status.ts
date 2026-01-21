export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'cancelled';

export function stripeIntentStatusToPaymentStatus(status: string): PaymentStatus {
  if (status === 'succeeded') return 'paid';
  if (status === 'canceled') return 'cancelled';
  if (
    status === 'processing' ||
    status === 'requires_action' ||
    status === 'requires_confirmation' ||
    status === 'requires_payment_method'
  ) {
    return 'pending';
  }
  return 'failed';
}
