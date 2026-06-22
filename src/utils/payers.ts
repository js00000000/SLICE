import type { Expense, Payment } from '../types';

/**
 * Normalize an expense's payers across the legacy single-payer (`paidBy`)
 * and v2 multi-payer (`payments`) shapes.
 */
export function getPayers(expense: Expense): Payment[] {
  const amountNum = typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount;
  if (expense.payments && expense.payments.length > 0) return expense.payments;
  if (expense.paidBy) return [{ memberId: expense.paidBy, amount: amountNum }];
  return [];
}

export interface PayerDisplay {
  /** Payer ids to render as names, primary first. */
  displayPayerIds: string[];
  /** Additional payers collapsed into a "+N" affordance (0 when none). */
  overflowCount: number;
}

/** How many payer names to show before collapsing the rest into "+N". */
const MAX_NAMES = 2;

/**
 * Decide how to render payers on a collapsed expense row.
 *
 * The "primary" payer is chosen by priority: the active "paid by" filter (if
 * that member paid) → the current user (if they paid) → otherwise the first
 * payer. Up to two names are shown (primary first); any further payers collapse
 * into a "+N" count — e.g. one payer "AA", two payers "AA, BB", five payers
 * "AA, BB, +3".
 */
export function resolvePayerDisplay(
  payers: Payment[],
  currentMemberId: string | null,
  filterPaidBy: string | null,
): PayerDisplay {
  const payerIds = payers.map(p => p.memberId);
  if (payerIds.length === 0) {
    return { displayPayerIds: [], overflowCount: 0 };
  }

  const primaryPayerId =
    filterPaidBy && payerIds.includes(filterPaidBy)
      ? filterPaidBy
      : currentMemberId && payerIds.includes(currentMemberId)
        ? currentMemberId
        : payerIds[0];

  const ordered = [primaryPayerId, ...payerIds.filter(id => id !== primaryPayerId)];
  return {
    displayPayerIds: ordered.slice(0, MAX_NAMES),
    overflowCount: Math.max(0, payerIds.length - MAX_NAMES),
  };
}
