import type { Payment } from '../types';

/**
 * Calculates a penny-accurate equal split among participants.
 * Distributes the remainder cents among the first few participants.
 */
export function calculateEvenSplit(amount: number, splitAmong: string[]): Payment[] {
  const participantCount = splitAmong.length;
  if (participantCount === 0) return [];

  const totalCents = Math.round(amount * 100);
  const baseCents = Math.floor(totalCents / participantCount);
  const remainderCents = totalCents % participantCount;

  return splitAmong.map((memberId, index) => {
    const centAmount = baseCents + (index < remainderCents ? 1 : 0);
    return {
      memberId,
      amount: centAmount / 100
    };
  });
}

/**
 * Detects if an array of splits represents a custom split or an even split.
 * Returns true if the difference between max and min amounts is greater than 1 cent.
 */
export function isCustomSplit(splits: Payment[] | undefined): boolean {
  if (!splits || splits.length === 0) return false;
  const amounts = splits.map(s => s.amount);
  const max = Math.max(...amounts);
  const min = Math.min(...amounts);
  return (max - min) > 0.015;
}
