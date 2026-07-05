export interface Member {
  id: string;
  name: string;
  isHost?: boolean;
}

export interface Payment {
  memberId: string;
  amount: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  payments?: Payment[];
  splitAmong: string[];
  splits?: Payment[];
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface CompletedSettlement {
  from: string;
  to: string;
  amount: number;
}

const toCents = (n: number) => Math.round(parseFloat(n.toString()) * 100);

/**
 * Rounds cent balances to whole-dollar values that sum to zero, biasing the
 * rounding adjustment so creditors are never short-changed: any leftover cents
 * are absorbed by debtors (or, if the leftover goes the other way, given to
 * creditors). Picks who absorbs by largest fractional remainder.
 */
function roundBalancesToWholeDollars(balancesCents: Record<string, number>): Record<string, number> {
  const rounded: Record<string, number> = {};
  Object.entries(balancesCents).forEach(([id, cents]) => {
    // `+ 0` collapses -0 (from rounding tiny negatives) to +0.
    rounded[id] = Math.round(cents / 100) + 0;
  });

  const totalCentsSum = Object.values(balancesCents).reduce((a, b) => a + b, 0);
  const targetSum = Math.round(totalCentsSum / 100);
  const roundedSum = Object.values(rounded).reduce((a, b) => a + b, 0);

  const diff = roundedSum - targetSum;
  if (diff === 0) return rounded;

  if (diff > 0) {
    // Too much credit shown — try to push debtors more negative first.
    const debtors = Object.entries(balancesCents)
      .filter(([, c]) => c < 0)
      .map(([id, c]) => ({ id, fraction: Math.abs(c) % 100 }))
      .sort((a, b) => b.fraction - a.fraction);
    
    let adjustedCount = 0;
    for (let i = 0; i < diff && i < debtors.length; i++) {
      rounded[debtors[i].id] -= 1;
      adjustedCount++;
    }

    // If there weren't enough debtors to absorb the difference, adjust other members
    if (adjustedCount < diff) {
      const adjustedIds = new Set(debtors.slice(0, adjustedCount).map(d => d.id));
      const others = Object.entries(balancesCents)
        .filter(([id]) => !adjustedIds.has(id))
        .map(([id, c]) => ({ id, fraction: Math.abs(c) % 100 }))
        .sort((a, b) => b.fraction - a.fraction);
      
      const remainingDiff = diff - adjustedCount;
      for (let i = 0; i < remainingDiff && i < others.length; i++) {
        rounded[others[i].id] -= 1;
      }
    }
  } else {
    // Too much debt shown — try to push creditors more positive first.
    const creditors = Object.entries(balancesCents)
      .filter(([, c]) => c > 0)
      .map(([id, c]) => ({ id, fraction: c % 100 }))
      .sort((a, b) => b.fraction - a.fraction);
    
    let adjustedCount = 0;
    for (let i = 0; i < -diff && i < creditors.length; i++) {
      rounded[creditors[i].id] += 1;
      adjustedCount++;
    }

    // If there weren't enough creditors to absorb the difference, adjust other members
    if (adjustedCount < -diff) {
      const adjustedIds = new Set(creditors.slice(0, adjustedCount).map(c => c.id));
      const others = Object.entries(balancesCents)
        .filter(([id]) => !adjustedIds.has(id))
        .map(([id, c]) => ({ id, fraction: Math.abs(c) % 100 }))
        .sort((a, b) => b.fraction - a.fraction);
      
      const remainingDiff = -diff - adjustedCount;
      for (let i = 0; i < remainingDiff && i < others.length; i++) {
        rounded[others[i].id] += 1;
      }
    }
  }

  return rounded;
}

export function calculateBalancesAndSettlements(
  members: Member[],
  expenses: Expense[],
  completedSettlements: CompletedSettlement[] = [],
) {
  // Accumulate balances in integer cents for accuracy.
  const balancesCents: Record<string, number> = {};
  members.forEach(m => balancesCents[m.id] = 0);

  expenses.forEach(exp => {
    const totalCents = toCents(exp.amount);
    const hasMultiplePayers = !!(exp.payments && exp.payments.length > 0);

    if (hasMultiplePayers) {
      exp.payments!.forEach(p => {
        if (balancesCents[p.memberId] !== undefined) {
          balancesCents[p.memberId] += toCents(p.amount);
        }
      });
    } else if (balancesCents[exp.paidBy] !== undefined) {
      balancesCents[exp.paidBy] += totalCents;
    }

    if (exp.splits && exp.splits.length > 0) {
      exp.splits.forEach(s => {
        if (balancesCents[s.memberId] !== undefined) {
          balancesCents[s.memberId] -= toCents(s.amount);
        }
      });
    } else if (exp.splitAmong && exp.splitAmong.length > 0) {
      // Legacy equal-split path: distribute remainder cents to the first N participants.
      const participantCount = exp.splitAmong.length;
      const baseCents = Math.floor(totalCents / participantCount);
      const remainderCents = totalCents % participantCount;
      exp.splitAmong.forEach((mId, index) => {
        const shareCents = baseCents + (index < remainderCents ? 1 : 0);
        if (balancesCents[mId] !== undefined) {
          balancesCents[mId] -= shareCents;
        }
      });
    }
  });

  // Apply completed manual payments: each payment reduces the payer's debt
  // and the receiver's credit. Skip records that reference unknown members
  // so an orphaned record can't half-apply. Snapping is applied within a
  // $1.00 threshold to prevent rounding artifacts from leaking.
  completedSettlements.forEach(s => {
    if (balancesCents[s.from] === undefined || balancesCents[s.to] === undefined) return;
    const cents = toCents(s.amount);
    const debtorBalanceCents = balancesCents[s.from];

    let appliedCents = cents;
    if (debtorBalanceCents < 0) {
      const remainingDebtCents = Math.abs(debtorBalanceCents);
      if (Math.abs(cents - remainingDebtCents) < 100) {
        appliedCents = remainingDebtCents;
      }
    }

    balancesCents[s.from] += appliedCents;
    balancesCents[s.to] -= appliedCents;
  });

  // Round balances to whole dollars so they match the UI's display granularity
  // and so settlements always sum to balances exactly.
  const balances = roundBalancesToWholeDollars(balancesCents);

  // Greedy debtor/creditor matching on the rounded balances.
  const debtors: { id: string, amount: number }[] = [];
  const creditors: { id: string, amount: number }[] = [];

  Object.entries(balances).forEach(([id, amt]) => {
    if (amt < 0) debtors.push({ id, amount: Math.abs(amt) });
    else if (amt > 0) creditors.push({ id, amount: amt });
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];
    const amount = Math.min(debtor.amount, creditor.amount);
    settlements.push({ from: debtor.id, to: creditor.id, amount });
    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount === 0) d++;
    if (creditor.amount === 0) c++;
  }

  return { balances, settlements };
}
