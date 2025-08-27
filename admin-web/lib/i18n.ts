export const dict = {
  en: {
    dashboard: 'Dashboard',
    complexes: 'Complexes',
    units: 'Units',
    installments: 'Installments',
    serviceFees: 'Service Fees',
    payments: 'Payments',
    users: 'Users',
    todayDue: 'Due Today',
    next30: 'Next 30 Days',
    pastDue: 'Past Due',
    collectedMtd: 'Collected MTD',
    filterAll: 'All',
    filterDue: 'Due',
    filterPastDue: 'Past Due',
  },
  ar: {
    dashboard: 'لوحة التحكم',
    complexes: 'المجمعات',
    units: 'الوحدات',
    installments: 'الأقساط',
    serviceFees: 'الرسوم الخدمية',
    payments: 'المدفوعات',
    users: 'المستخدمون',
    todayDue: 'المستحق اليوم',
    next30: 'خلال 30 يومًا',
    pastDue: 'متأخر',
    collectedMtd: 'المحصل هذا الشهر',
    filterAll: 'الكل',
    filterDue: 'مستحق',
    filterPastDue: 'متأخر',
  },
};

export type Locale = keyof typeof dict;

export function t(locale: Locale, key: keyof typeof dict['en']) {
  return dict[locale][key] || key;
}

