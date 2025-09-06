// lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import { getLocales } from 'expo-localization';

export type AppLanguage = 'en' | 'ar' | 'ku';

const resources = {
  en: {
    translation: {
      dashboard: 'Dashboard',
      welcome: 'Welcome',
      client: 'Client',
      logout: 'Logout',
      quickMethods: 'Methods',
      quickUpcoming: 'Upcoming',
      quickHistory: 'History',
      nextPayment: 'Next Payment',
      servicesFees: 'Services & Fees',
      serviceFee: 'Service fee',
      manage: 'Manage',
      setup: 'Set up',
      noUnits: 'No units assigned yet.',
      remove: 'Remove',
      addCard: 'Add Card',
      saving: 'Saving…',
      totalDueToday: 'Total due today',
      next30: 'Next 30 days',
      pastDue: 'Past due',
      receipts: 'Receipts',
      pay: 'Pay',
      payAll: 'Pay All',
      promise: 'Promise',
      due: 'Due',
      overdue: 'Overdue',
      paid: 'Paid',
      upcomingAndDue: 'Upcoming & Due',
      seeAll: 'See all',
      noDues: 'No dues at the moment.',
      recentPayments: 'Recent Payments',
      noPayments: 'No payments yet.',
      wallet: 'Wallet',
      balance: 'Balance',
      topup: 'Top up',
      smartAutopayDay: 'Autopay Day',
      processingPayment: 'Processing payment…',
      paymentSucceeded: 'Payment succeeded',
      paymentFailed: 'Payment failed',
      paymentCanceled: 'Payment canceled',
      today: 'Today',
      next30d: 'Next 30d',
      pastDueShort: 'Past due',
      // Screens
      paymentMethods: 'Payment Methods',
      upcomingDues: 'Upcoming Dues',
      paymentHistory: 'Payment History',
      loading: 'Loading…',
      amountIQD: 'Amount',
      paidOn: 'Paid',
      typeInstallment: 'Installment',
      typeServiceFee: 'Service Fee',
      autopay: 'Autopay',
      unit: 'Unit',
      language: 'Language',
      confirm: 'Confirm',
      cancel: 'Cancel',
    },
  },
  ar: {
    translation: {
      dashboard: 'لوحة التحكم',
      welcome: 'مرحباً',
      client: 'العميل',
      logout: 'تسجيل الخروج',
      quickMethods: 'البطاقات',
      quickUpcoming: 'المستحقات',
      quickHistory: 'المدفوعات',
      nextPayment: 'الدفعة التالية',
      servicesFees: 'الخدمات والرسوم',
      serviceFee: 'رسوم الخدمة',
      manage: 'إدارة',
      setup: 'إعداد',
      noUnits: 'لا توجد وحدات مرتبطة بعد.',
      remove: 'حذف',
      addCard: 'إضافة بطاقة',
      saving: 'جاري الحفظ…',
      totalDueToday: 'المستحق اليوم',
      next30: '٣٠ يوماً القادمة',
      pastDue: 'متأخر',
      receipts: 'الإيصالات',
      pay: 'ادفع',
      payAll: 'ادفع الكل',
      promise: 'تعهد',
      due: 'مستحق',
      overdue: 'متأخر',
      paid: 'مدفوع',
      upcomingAndDue: 'المستحق والقادم',
      seeAll: 'عرض الكل',
      noDues: 'لا توجد مستحقات حالياً.',
      recentPayments: 'المدفوعات الأخيرة',
      noPayments: 'لا توجد مدفوعات بعد.',
      wallet: 'المحفظة',
      balance: 'الرصيد',
      topup: 'شحن',
      smartAutopayDay: 'يوم الدفع الآلي',
      processingPayment: 'جاري معالجة الدفع…',
      paymentSucceeded: 'تم الدفع بنجاح',
      paymentFailed: 'فشل الدفع',
      paymentCanceled: 'تم إلغاء الدفع',
      today: 'اليوم',
      next30d: '٣٠ يوماً',
      pastDueShort: 'متأخر',
      paymentMethods: 'طرق الدفع',
      upcomingDues: 'المستحقات القادمة',
      paymentHistory: 'سجل المدفوعات',
      loading: 'جاري التحميل…',
      amountIQD: 'المبلغ',
      paidOn: 'تاريخ الدفع',
      typeInstallment: 'قسط',
      typeServiceFee: 'رسوم خدمة',
      autopay: 'الدفع التلقائي',
      unit: 'الوحدة',
      language: 'اللغة',
      confirm: 'تأكيد',
      cancel: 'إلغاء',
    },
  },
  ku: {
    translation: {
      dashboard: 'داشبۆرد',
      welcome: 'ب خیر بێی',
      client: 'کڕیار',
      logout: 'چوونەدەرەوە',
      quickMethods: 'کارتەکان',
      quickUpcoming: 'قەرزەکان',
      quickHistory: 'پارەدانەکان',
      nextPayment: 'پارەدانی داهاتوو',
      servicesFees: 'خزمەتگوزاری و کرێی خزمەت',
      serviceFee: 'کرێی خزمەت',
      manage: 'بەڕیوەبردن',
      setup: 'دەستپێکردن',
      noUnits: 'هیچ یەکەیەکت نییە.',
      remove: 'سڕینەوە',
      addCard: 'زیادکردنی کارت',
      saving: 'خەزنكردن…',
      totalDueToday: 'کۆی ئەمڕۆ',
      next30: '٣٠ ڕۆژی داهاتوو',
      pastDue: 'قەرزدار',
      receipts: 'وەسڵەکان',
      pay: 'پارەدان',
      payAll: 'پارەدان بۆ هەموو',
      promise: 'وەعد',
      due: 'کاتی پارەدان',
      overdue: 'قەرزدار',
      paid: 'پارەدراو',
      upcomingAndDue: 'ئەمەد و کاتی پارەدان',
      seeAll: 'بینینی هەموو',
      noDues: 'لە ئێستا هیچەک نییە.',
      recentPayments: 'پارەدانەکانی کۆتایی',
      noPayments: 'تا ئێستا پارەدان نییە.',
      wallet: 'جزدان',
      balance: 'باڵانس',
      topup: 'پڕکردنەوە',
      smartAutopayDay: 'ڕۆژی پارەدانی ئۆتۆماتیکی',
      processingPayment: 'چاوەڕوانە لە جێبەجێبوونی پارەدان…',
      paymentSucceeded: 'پارەدان سەرکەوتوو بوو',
      paymentFailed: 'پارەدان شکستی هێنا',
      paymentCanceled: 'پارەدان هەڵوەشاوە',
      today: 'ئەمڕۆ',
      next30d: '٣٠ ڕۆژ',
      pastDueShort: 'قەرزدار',
      paymentMethods: 'ڕێگاکانی پارەدان',
      upcomingDues: 'قەرزە داهاتووەکان',
      paymentHistory: 'مێژووی پارەدان',
      loading: 'ئامادەکردن…',
      amountIQD: 'بڕ',
      paidOn: 'کاتی پارەدان',
      typeInstallment: 'قسط',
      typeServiceFee: 'کرێی خزمەت',
      autopay: 'پارەدانی ئۆتۆماتیکی',
      unit: 'یەکە',
      language: 'زمان',
      confirm: 'پشتڕاستکردنەوە',
      cancel: 'هەڵوەشاندنەوە',
    },
  },
} as const;

function deviceLang(): AppLanguage {
  const code = getLocales()[0]?.languageCode?.toLowerCase();
  if (code === 'ar') return 'ar';
  if (code === 'ku') return 'ku';
  // Fallback to Arabic when not supported
  return 'ar';
}

function applyRTL(lang: AppLanguage) {
  const shouldBeRTL = lang === 'ar' || lang === 'ku';
  // Always allow RTL; force when Arabic chosen (may require app reload to fully take effect)
  I18nManager.allowRTL(true);
  if (I18nManager.isRTL !== shouldBeRTL) {
    try {
      I18nManager.forceRTL(shouldBeRTL);
      // NOTE: Some layouts may require a manual reload for full RTL flip.
      // You can trigger one in your settings screen using expo-updates if desired.
    } catch {
      // no-op
    }
  }
}

if (!i18n.isInitialized) {
  const lang = deviceLang();
  applyRTL(lang);

  i18n.use(initReactI18next).init({
    resources,
    lng: lang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false }, // React already escapes
    returnNull: false,
    // No compatibilityJSON here — it was removed from recent typings
  });
}

export function setAppLanguage(lang: AppLanguage) {
  applyRTL(lang);
  i18n.changeLanguage(lang);
}

export default i18n;
