export function formatIQD(amount: number, locale: string = 'en-IQ') {
  // IQD commonly shown without decimals
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency: 'IQD', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

export type Status = 'paid' | 'due' | 'overdue';

