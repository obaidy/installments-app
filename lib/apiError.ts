export type ApiError = { code?: string; message?: string; fields?: Record<string, string[]> } | string | null | undefined;

export function formatApiError(err: ApiError): string {
  if (!err) return 'Error';
  if (typeof err === 'string') return err;
  const code = err.code || 'INTERNAL';
  const map: Record<string, string> = {
    VALIDATION_ERROR: 'Please correct the highlighted fields.',
    UNAUTHORIZED: 'Please sign in again.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    INVITE_FAILED: 'Unable to send invite. Try again later.',
    INTERNAL: 'A server error occurred.',
    NOTHING_TO_CHARGE: 'There is nothing to charge.',
    NO_CUSTOMER: 'No payment method on file.',
  };
  return map[code] || err.message || 'Error';
}

