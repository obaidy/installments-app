export function formatIQD(amount: number, locale: string = 'en-IQ') {
  // IQD commonly shown without decimals
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency: 'IQD', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

export type Status = 'paid' | 'due' | 'overdue';


export function formatDate(d: string | Date, locale: string = 'ar-IQ') {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(dt);
}
