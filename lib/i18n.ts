// lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import { getLocales } from 'expo-localization';

export type AppLanguage = 'en' | 'ar';

const resources = {
  en: {
    translation: {
      dashboard: 'Dashboard',
      totalDueToday: 'Total due today',
      next30: 'Next 30 days',
      pastDue: 'Past due',
      receipts: 'Receipts',
      pay: 'Pay',
      due: 'Due',
      overdue: 'Overdue',
      paid: 'Paid',
      upcomingAndDue: 'Upcoming & Due',
      processingPayment: 'Processing payment…',
      paymentSucceeded: 'Payment succeeded',
      paymentFailed: 'Payment failed',
      paymentCanceled: 'Payment canceled',
      today: 'Today',
      next30d: 'Next 30d',
      pastDueShort: 'Past due',
    },
  },
  ar: {
    translation: {
      dashboard: 'لوحة التحكم',
      totalDueToday: 'المستحق اليوم',
      next30: '٣٠ يوماً القادمة',
      pastDue: 'متأخر',
      receipts: 'الإيصالات',
      pay: 'ادفع',
      due: 'مستحق',
      overdue: 'متأخر',
      paid: 'مدفوع',
      upcomingAndDue: 'المستحق والقادم',
      processingPayment: 'جاري معالجة الدفع…',
      paymentSucceeded: 'تم الدفع بنجاح',
      paymentFailed: 'فشل الدفع',
      paymentCanceled: 'تم إلغاء الدفع',
      today: 'اليوم',
      next30d: '٣٠ يوماً',
      pastDueShort: 'متأخر',
    },
  },
} as const;

function deviceLang(): AppLanguage {
  const code = getLocales()[0]?.languageCode?.toLowerCase();
  return code === 'ar' ? 'ar' : 'en';
}

function applyRTL(lang: AppLanguage) {
  const shouldBeRTL = lang === 'ar';
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
