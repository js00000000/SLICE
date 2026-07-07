import type { Group, GroupCurrency, Expense } from '../types';

export const FALLBACK_DEFAULT_CURRENCY = 'TWD';

type GroupCurrencyFields = Pick<Group, 'defaultCurrency' | 'currencies'>;

/**
 * The group's default currency code. Legacy groups without the field are TWD.
 */
export function getDefaultCurrency(group?: GroupCurrencyFields | null): string {
  return group?.defaultCurrency ?? FALLBACK_DEFAULT_CURRENCY;
}

/**
 * All currencies of the group, including the default (rate 1). Legacy groups
 * without a `currencies` array get a virtual single-entry list.
 */
export function getGroupCurrencies(group?: GroupCurrencyFields | null): GroupCurrency[] {
  if (group?.currencies && group.currencies.length > 0) {
    return group.currencies;
  }
  return [{ code: getDefaultCurrency(group), rate: 1 }];
}

/**
 * code → rate lookup for settlement/display conversion. The default currency
 * is always forced to rate 1; invalid entries (rate <= 0 / non-finite) are skipped.
 */
export function buildRateMap(group?: GroupCurrencyFields | null): Record<string, number> {
  const defaultCode = getDefaultCurrency(group);
  const rates: Record<string, number> = {};
  getGroupCurrencies(group).forEach(({ code, rate }) => {
    if (Number.isFinite(rate) && rate > 0) {
      rates[code] = rate;
    }
  });
  rates[defaultCode] = 1;
  return rates;
}

/**
 * Conversion rate for an expense into the group default currency.
 * Legacy expenses (no currency), default-currency expenses, and unknown
 * codes all resolve to 1.
 */
export function getExpenseRate(
  expense: Pick<Expense, 'currency'>,
  group?: GroupCurrencyFields | null,
): number {
  if (!expense.currency) return 1;
  return buildRateMap(group)[expense.currency] ?? 1;
}

export function convertToDefault(amount: number, rate: number): number {
  return amount * rate;
}

/**
 * True when the expense is stamped with a currency different from the group
 * default — the only case where the currency label is shown in the UI.
 */
export function isForeignExpense(
  expense: Pick<Expense, 'currency'>,
  group?: GroupCurrencyFields | null,
): boolean {
  return !!expense.currency && expense.currency !== getDefaultCurrency(group);
}

/**
 * Free-form currency codes are 1–4 characters after trimming.
 */
export function validateCurrencyCode(code: string): boolean {
  const trimmed = code.trim();
  return trimmed.length >= 1 && trimmed.length <= 4;
}

const roundRate = (rate: number) => Math.round(rate * 1e6) / 1e6;

/**
 * Rebase every rate onto a new default currency picked from the list.
 * The new default lands at exactly 1 and every other entry (including the
 * old default) is divided by the new default's former rate.
 * Returns the input unchanged if `newDefault` isn't in the list or has an
 * unusable rate.
 */
export function recomputeCurrenciesForNewDefault(
  currencies: GroupCurrency[],
  newDefault: string,
): GroupCurrency[] {
  const target = currencies.find(c => c.code === newDefault);
  if (!target || !Number.isFinite(target.rate) || target.rate <= 0) {
    return currencies;
  }
  const r = target.rate;
  return currencies.map(c => ({
    code: c.code,
    rate: c.code === newDefault ? 1 : roundRate(c.rate / r),
  }));
}
