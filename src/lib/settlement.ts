export interface Member {
  id: string;
  name: string;
  isHost?: boolean;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export function calculateBalancesAndSettlements(members: Member[], expenses: Expense[]) {
  // 1. Calculate raw balances (positive = gets money back, negative = owes money)
  const balances: Record<string, number> = {};
  members.forEach(m => balances[m.id] = 0);

  expenses.forEach(exp => {
    const amount = parseFloat(exp.amount.toString());
    // Payer gets the full amount added to their balance
    if (balances[exp.paidBy] !== undefined) {
      balances[exp.paidBy] += amount;
    }
    // Splitters subtract their share
    if (exp.splitAmong && exp.splitAmong.length > 0) {
      const splitAmt = amount / exp.splitAmong.length;
      exp.splitAmong.forEach(mId => {
        if (balances[mId] !== undefined) {
          balances[mId] -= splitAmt;
        }
      });
    }
  });

  // 2. Compute settlements (Greedy algorithm to settle debts)
  const debtors: { id: string, amount: number }[] = [];
  const creditors: { id: string, amount: number }[] = [];

  Object.entries(balances).forEach(([id, amt]) => {
    if (amt < -0.01) debtors.push({ id, amount: Math.abs(amt) });
    else if (amt > 0.01) creditors.push({ id, amount: amt });
  });

  // Sort to optimize matching (largest debts first)
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let d = 0;
  let c = 0;

  const debtors_copy = debtors.map(x => ({ ...x }));
  const creditors_copy = creditors.map(x => ({ ...x }));

  while (d < debtors_copy.length && c < creditors_copy.length) {
    const debtor = debtors_copy[d];
    const creditor = creditors_copy[c];
    const amount = Math.min(debtor.amount, creditor.amount);
    settlements.push({ from: debtor.id, to: creditor.id, amount: amount });
    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount < 0.01) d++;
    if (creditor.amount < 0.01) c++;
  }

  return { balances, settlements };
}
