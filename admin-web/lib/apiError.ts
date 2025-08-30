import { t } from './i18n';

type ErrorObj = { code?: string; message?: string; fields?: Record<string, string[]> } | string | null | undefined;

export function formatApiError(locale: 'ar'|'en'|'ku', err: ErrorObj): string {
  if (!err) return t(locale, 'unknownError') || 'Error';
  if (typeof err === 'string') return err;
  const code = err.code || 'INTERNAL';
  const map: Record<string, string> = {
    VALIDATION_ERROR: t(locale, 'validationError') || 'Validation error',
    UNAUTHORIZED: t(locale, 'unauthorized') || 'Unauthorized',
    FORBIDDEN: t(locale, 'forbidden') || 'Forbidden',
    INVITE_FAILED: t(locale, 'inviteFailed') || 'Invite failed',
    INTERNAL: t(locale, 'internalError') || 'Server error',
    NOTHING_TO_CHARGE: 'Nothing to charge',
    NO_CUSTOMER: 'No customer on file',
  };
  return map[code] || err.message || 'Error';
}


