import type { Timestamp } from 'firebase/firestore';

/**
 * Format a Firebase Timestamp or Date into a localized string.
 * Pass `includeTime: false` for a date-only display (e.g. compact meta lines).
 */
export function formatDate(
  date: Timestamp | Date | undefined,
  locale: string = 'en',
  includeTime: boolean = true,
) {
  if (!date) return '';

  const d = date instanceof Date ? date : date.toDate();

  return d.toLocaleString(locale, {
    month: 'numeric',
    day: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  });
}

/**
 * Format a number as a localized currency string.
 * Without a code: default-currency style, e.g. "$252".
 * With a code (foreign currency label): e.g. "JPY 1,200" — up to 2 decimals,
 * trailing zeros trimmed.
 */
export function formatCurrency(amount: number, code?: string) {
  if (!code) {
    // Simple $ format for now as per current UI
    return `$${amount.toFixed(0)}`;
  }
  return `${code} ${Number(amount.toFixed(2)).toLocaleString()}`;
}

/**
 * Helper to get a consistent integer representation of amount.
 */
export function toAmountDisplay(amount: number) {
  return amount.toFixed(0);
}
