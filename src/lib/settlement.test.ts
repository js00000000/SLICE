import { describe, it, expect } from 'vitest';
import { calculateBalancesAndSettlements } from './settlement';
import type { Member, Expense, CompletedSettlement } from './settlement';

describe('Settlement Logic', () => {
  it('should calculate correct balances for simple two-person split', () => {
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Lunch',
        amount: 100,
        paidBy: '1', // Alice paid 100
        splitAmong: ['1', '2'], // Split between Alice and Bob
      },
    ];

    const { balances, settlements } = calculateBalancesAndSettlements(members, expenses);

    // Alice: +100 (paid) - 50 (share) = +50
    // Bob: - 50 (share) = -50
    expect(balances['1']).toBe(50);
    expect(balances['2']).toBe(-50);

    expect(settlements).toHaveLength(1);
    expect(settlements[0]).toEqual({ from: '2', to: '1', amount: 50 });
  });

  it('should handle multiple expenses and complex splits', () => {
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Charlie' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Dinner',
        amount: 300,
        paidBy: '1', // Alice paid 300
        splitAmong: ['1', '2', '3'], // 100 each
      },
      {
        id: 'e2',
        description: 'Drinks',
        amount: 60,
        paidBy: '2', // Bob paid 60
        splitAmong: ['2', '3'], // 30 each
      },
    ];

    const { balances, settlements } = calculateBalancesAndSettlements(members, expenses);

    // Alice: +300 (paid e1) - 100 (share e1) = +200
    // Bob: +60 (paid e2) - 100 (share e1) - 30 (share e2) = -70
    // Charlie: -100 (share e1) - 30 (share e2) = -130
    expect(balances['1']).toBe(200);
    expect(balances['2']).toBe(-70);
    expect(balances['3']).toBe(-130);

    // Settlements:
    // Charlie pays 130 to Alice
    // Bob pays 70 to Alice
    expect(settlements).toContainEqual({ from: '3', to: '1', amount: 130 });
    expect(settlements).toContainEqual({ from: '2', to: '1', amount: 70 });
  });

  it('should handle zero balances correctly', () => {
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Lunch',
        amount: 100,
        paidBy: '1',
        splitAmong: ['1', '2'],
      },
      {
        id: 'e2',
        description: 'Dinner',
        amount: 100,
        paidBy: '2',
        splitAmong: ['1', '2'],
      },
    ];

    const { balances, settlements } = calculateBalancesAndSettlements(members, expenses);

    expect(balances['1']).toBe(0);
    expect(balances['2']).toBe(0);
    expect(settlements).toHaveLength(0);
  });

  it('should round to whole-dollar balances and settlements when the split is uneven', () => {
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Charlie' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Shared bill',
        amount: 100,
        paidBy: '1',
        splitAmong: ['1', '2', '3'], // raw cents: Alice +66.66, Bob -33.33, Charlie -33.33
      },
    ];

    const { balances, settlements } = calculateBalancesAndSettlements(members, expenses);

    // The display rounds creditors up and pushes the leftover dollar onto the
    // debtor with the largest fractional remainder, so totals balance exactly.
    expect(balances['1']).toBe(67);
    expect(balances['2']).toBe(-34);
    expect(balances['3']).toBe(-33);

    settlements.forEach(s => {
      expect(Number.isInteger(s.amount)).toBe(true);
    });

    // Settlements sum to Alice's balance and each debtor's balance exactly.
    expect(settlements.reduce((sum, s) => sum + s.amount, 0)).toBe(67);
    expect(settlements).toContainEqual({ from: '2', to: '1', amount: 34 });
    expect(settlements).toContainEqual({ from: '3', to: '1', amount: 33 });
  });

  it('should not drift across many uneven-split expenses', () => {
    // Regression: previously each $10 / 3 expense seeded 3.333... into balances,
    // accumulating floating-point noise. Cents math + whole-dollar rounding
    // produces stable, summable balances.
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Charlie' },
    ];
    const expenses: Expense[] = Array.from({ length: 5 }, (_, i) => ({
      id: `e${i}`,
      description: 'Lunch',
      amount: 10,
      paidBy: '1',
      splitAmong: ['1', '2', '3'],
    }));

    const { balances, settlements } = calculateBalancesAndSettlements(members, expenses);

    // Raw cents: Alice +33.30, Bob -16.65, Charlie -16.65.
    // Rounded: 33, -17, -17 (sum -1). Push creditor up: Alice +34.
    expect(balances['1']).toBe(34);
    expect(balances['2']).toBe(-17);
    expect(balances['3']).toBe(-17);

    settlements.forEach(s => {
      expect(Number.isInteger(s.amount)).toBe(true);
    });
    expect(settlements.reduce((sum, s) => sum + s.amount, 0)).toBe(34);
  });

  it('should handle cases where the payer is not in the splitAmong list', () => {
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Charlie' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Alice treats Bob and Charlie',
        amount: 100,
        paidBy: '1',
        splitAmong: ['2', '3'], // Alice is NOT in this list
      },
    ];

    const { balances, settlements } = calculateBalancesAndSettlements(members, expenses);

    // Alice: +100
    // Bob: -50
    // Charlie: -50
    expect(balances['1']).toBe(100);
    expect(balances['2']).toBe(-50);
    expect(balances['3']).toBe(-50);
    expect(settlements).toHaveLength(2);
  });

  it('should not crash or produce settlements for expenses with no splitters', () => {
    const members: Member[] = [
      { id: '1', name: 'Alice' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Empty split',
        amount: 100,
        paidBy: '1',
        splitAmong: [],
      },
    ];

    const { balances, settlements } = calculateBalancesAndSettlements(members, expenses);

    expect(balances['1']).toBe(100); // She paid, but nobody owes her anything because nobody was in the split
    expect(settlements).toHaveLength(0);
  });

  it('should handle complex debt cycles and minimize transactions', () => {
    // This test ensures the greedy algorithm correctly settles multiple overlapping debts
    const members: Member[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
      { id: '3', name: 'C' },
      { id: '4', name: 'D' },
    ];
    const expenses: Expense[] = [
      { id: 'e1', description: 'B owes A', amount: 100, paidBy: '1', splitAmong: ['2'] }, // B owes A 100
      { id: 'e2', description: 'C owes B', amount: 100, paidBy: '2', splitAmong: ['3'] }, // C owes B 100
      { id: 'e3', description: 'D owes C', amount: 100, paidBy: '3', splitAmong: ['4'] }, // D owes C 100
    ];

    const { balances, settlements } = calculateBalancesAndSettlements(members, expenses);

    // A: +100
    // B: -100 + 100 = 0
    // C: -100 + 100 = 0
    // D: -100
    expect(balances['1']).toBe(100);
    expect(balances['2']).toBe(0);
    expect(balances['3']).toBe(0);
    expect(balances['4']).toBe(-100);

    // Should result in only ONE transaction: D pays A 100
    expect(settlements).toHaveLength(1);
    expect(settlements[0]).toEqual({ from: '4', to: '1', amount: 100 });
  });

  it('should calculate correct balances for multiple payers', () => {
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Charlie' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Dinner',
        amount: 300,
        paidBy: '1', // Legacy fallback
        payments: [
          { memberId: '1', amount: 200 }, // Alice paid 200
          { memberId: '2', amount: 100 }, // Bob paid 100
        ],
        splitAmong: ['1', '2', '3'], // 100 each
      },
    ];

    const { balances, settlements } = calculateBalancesAndSettlements(members, expenses);

    // Alice: +200 (paid) - 100 (share) = +100
    // Bob: +100 (paid) - 100 (share) = 0
    // Charlie: -100 (share) = -100
    expect(balances['1']).toBe(100);
    expect(balances['2']).toBe(0);
    expect(balances['3']).toBe(-100);

    expect(settlements).toHaveLength(1);
    expect(settlements[0]).toEqual({ from: '3', to: '1', amount: 100 });
  });

  it('should handle multiple payers where some are not in the split', () => {
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Charlie' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Gift',
        amount: 100,
        paidBy: '1',
        payments: [
          { memberId: '1', amount: 60 },
          { memberId: '3', amount: 40 },
        ],
        splitAmong: ['2'], // Only Bob benefits
      },
    ];

    const { balances } = calculateBalancesAndSettlements(members, expenses);

    // Alice: +60 (paid) - 0 (share) = +60
    // Bob: +0 (paid) - 100 (share) = -100
    // Charlie: +40 (paid) - 0 (share) = +40
    expect(balances['1']).toBe(60);
    expect(balances['2']).toBe(-100);
    expect(balances['3']).toBe(40);
  });

  it('should round sub-dollar balances to zero', () => {
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Split Lunch',
        amount: 33.33,
        paidBy: '1',
        payments: [
          { memberId: '1', amount: 16.66 },
          { memberId: '2', amount: 16.67 },
        ],
        splitAmong: ['1', '2'], // 3333 cents / 2 = 1666 base + 1 remainder
      },
    ];

    const { balances, settlements } = calculateBalancesAndSettlements(members, expenses);

    // Raw cents balance is ±$0.01, well below display granularity → both 0.
    expect(balances['1']).toBe(0);
    expect(balances['2']).toBe(0);
    expect(settlements).toHaveLength(0);
  });

  it('should fallback to single payer if payments array is empty', () => {
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Legacy Style',
        amount: 100,
        paidBy: '1',
        payments: [], // Empty array
        splitAmong: ['1', '2'],
      },
    ];

    const { balances } = calculateBalancesAndSettlements(members, expenses);

    expect(balances['1']).toBe(50);
    expect(balances['2']).toBe(-50);
  });

  it('should calculate correct balances for custom split amounts', () => {
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Charlie' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Custom Split',
        amount: 100,
        paidBy: '1',
        splitAmong: ['1', '2', '3'],
        splits: [
          { memberId: '1', amount: 20 },
          { memberId: '2', amount: 50 },
          { memberId: '3', amount: 30 },
        ],
      },
    ];

    const { balances } = calculateBalancesAndSettlements(members, expenses);

    // Alice: +100 (paid) - 20 (share) = +80
    // Bob: -50 (share) = -50
    // Charlie: -30 (share) = -30
    expect(balances['1']).toBe(80);
    expect(balances['2']).toBe(-50);
    expect(balances['3']).toBe(-30);
  });

  it('should handle custom splits where the payer is not a participant', () => {
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Alice treats Bob',
        amount: 100,
        paidBy: '1',
        splitAmong: ['2'],
        splits: [
          { memberId: '2', amount: 100 },
        ],
      },
    ];

    const { balances } = calculateBalancesAndSettlements(members, expenses);

    expect(balances['1']).toBe(100);
    expect(balances['2']).toBe(-100);
  });

  it('should handle multiple payers with custom split amounts', () => {
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Charlie' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Dinner',
        amount: 200,
        paidBy: '1',
        payments: [
          { memberId: '1', amount: 150 },
          { memberId: '2', amount: 50 },
        ],
        splitAmong: ['1', '2', '3'],
        splits: [
          { memberId: '1', amount: 40 },
          { memberId: '2', amount: 100 },
          { memberId: '3', amount: 60 },
        ],
      },
    ];

    const { balances } = calculateBalancesAndSettlements(members, expenses);

    // Alice: +150 (paid) - 40 (share) = +110
    // Bob: +50 (paid) - 100 (share) = -50
    // Charlie: -60 (share) = -60
    expect(balances['1']).toBe(110);
    expect(balances['2']).toBe(-50);
    expect(balances['3']).toBe(-60);
  });

  it('should handle partial custom splits (using splits property only)', () => {
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Partial Split',
        amount: 100,
        paidBy: '1',
        splitAmong: ['1', '2'], // Should be ignored in favor of splits
        splits: [
          { memberId: '2', amount: 100 },
          // Alice share is 0 implicitly because she's not in splits
        ],
      },
    ];

    const { balances } = calculateBalancesAndSettlements(members, expenses);

    expect(balances['1']).toBe(100);
    expect(balances['2']).toBe(-100);
  });

  it('should never short-change the creditor when rounding for display', () => {
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Charlie' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Bob pays for an uneven split',
        amount: 10,
        paidBy: '2',
        splitAmong: ['1', '2', '3'],
      },
    ];

    const { balances, settlements } = calculateBalancesAndSettlements(members, expenses);

    // Raw cents: Alice -3.34, Bob +6.67, Charlie -3.33.
    // Bob (the payer/creditor) keeps his $7 — Alice (largest debtor fraction) absorbs the rounding.
    expect(balances['1']).toBe(-4);
    expect(balances['2']).toBe(7);
    expect(balances['3']).toBe(-3);

    expect(settlements.reduce((sum, s) => sum + s.amount, 0)).toBe(7);
    expect(settlements).toContainEqual({ from: '1', to: '2', amount: 4 });
    expect(settlements).toContainEqual({ from: '3', to: '2', amount: 3 });
  });

  it('should fall back to first-N when the legacy single payer is not in splitAmong', () => {
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Charlie' },
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        description: 'Alice treats',
        amount: 10,
        paidBy: '1',
        splitAmong: ['2', '3'], // payer not a participant
      },
    ];

    const { balances } = calculateBalancesAndSettlements(members, expenses);

    // 1000 / 2 = 500 base + 0 remainder. Clean split.
    expect(balances['1']).toBe(10);
    expect(balances['2']).toBe(-5);
    expect(balances['3']).toBe(-5);
  });

  it('should handle a complex multi-member, mixed-expense scenario', () => {
    // 5 members, 7 expenses mixing single-payer, multi-payer, custom splits,
    // treats, and uneven amounts. Exercises rounding adjustment and produces
    // two creditors + three debtors.
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Charlie' },
      { id: '4', name: 'Dave' },
      { id: '5', name: 'Eve' },
    ];
    const expenses: Expense[] = [
      // Alice pays $123.45 for dinner, split evenly 5 ways ($24.69 each, clean).
      { id: 'e1', description: 'Dinner', amount: 123.45, paidBy: '1', splitAmong: ['1', '2', '3', '4', '5'] },
      // Bob pays $50.50 for cab, split A/B/C (5050 / 3 = 1683 base + 1 remainder).
      { id: 'e2', description: 'Cab', amount: 50.50, paidBy: '2', splitAmong: ['1', '2', '3'] },
      // Alice + Charlie split paying $80 brunch, even 4-way.
      {
        id: 'e3', description: 'Brunch', amount: 80, paidBy: '1',
        payments: [{ memberId: '1', amount: 40 }, { memberId: '3', amount: 40 }],
        splitAmong: ['1', '2', '3', '4'],
      },
      // Dave pays $33 coffee, custom split.
      {
        id: 'e4', description: 'Coffee', amount: 33, paidBy: '4',
        splitAmong: ['1', '2', '3'],
        splits: [
          { memberId: '1', amount: 10 },
          { memberId: '2', amount: 15 },
          { memberId: '3', amount: 8 },
        ],
      },
      // Alice treats B/C/D/E to a $99.99 concert (9999 / 4 = 2499 base + 3 remainder).
      { id: 'e5', description: 'Concert', amount: 99.99, paidBy: '1', splitAmong: ['2', '3', '4', '5'] },
      // Eve pays $42.42 gas, split evenly 5 ways (4242 / 5 = 848 base + 2 remainder).
      { id: 'e6', description: 'Gas', amount: 42.42, paidBy: '5', splitAmong: ['1', '2', '3', '4', '5'] },
      // B/C/D each chip in $3000 + Eve $6000 = $150 hotel, split evenly 5 ways.
      {
        id: 'e7', description: 'Hotel', amount: 150, paidBy: '2',
        payments: [
          { memberId: '2', amount: 30 },
          { memberId: '3', amount: 30 },
          { memberId: '4', amount: 30 },
          { memberId: '5', amount: 60 },
        ],
        splitAmong: ['1', '2', '3', '4', '5'],
      },
    ];

    const { balances, settlements } = calculateBalancesAndSettlements(members, expenses);

    // Raw cents totals before rounding:
    //   A +153.42, B -59.51, C -63.00, D -45.17, E +14.26
    // Math.round: 153, -60, -63, -45, 14 → sum -1
    // Push creditor with largest fractional remainder (A: 42 > E: 26) up.
    expect(balances['1']).toBe(154);
    expect(balances['2']).toBe(-60);
    expect(balances['3']).toBe(-63);
    expect(balances['4']).toBe(-45);
    expect(balances['5']).toBe(14);

    // Sanity invariants.
    Object.values(balances).forEach(b => expect(Number.isInteger(b)).toBe(true));
    expect(Object.values(balances).reduce((a, b) => a + b, 0)).toBe(0);

    settlements.forEach(s => expect(Number.isInteger(s.amount)).toBe(true));
    members.forEach(m => {
      const incoming = settlements.filter(s => s.to === m.id).reduce((a, s) => a + s.amount, 0);
      const outgoing = settlements.filter(s => s.from === m.id).reduce((a, s) => a + s.amount, 0);
      expect(incoming - outgoing).toBe(balances[m.id]);
    });

    // Greedy: C (63) → A, B (60) → A, D (45) splits between A (31) and E (14).
    expect(settlements).toContainEqual({ from: '3', to: '1', amount: 63 });
    expect(settlements).toContainEqual({ from: '2', to: '1', amount: 60 });
    expect(settlements).toContainEqual({ from: '4', to: '1', amount: 31 });
    expect(settlements).toContainEqual({ from: '4', to: '5', amount: 14 });
    expect(settlements).toHaveLength(4);
  });

  describe('with completed manual settlements', () => {
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];
    const expenses: Expense[] = [
      { id: 'e1', description: 'Lunch', amount: 100, paidBy: '1', splitAmong: ['1', '2'] },
    ];

    it('zeroes balances and removes settlement when the full debt is marked paid', () => {
      const { balances, settlements } = calculateBalancesAndSettlements(
        members,
        expenses,
        [{ from: '2', to: '1', amount: 50 }],
      );
      expect(balances['1']).toBe(0);
      expect(balances['2']).toBe(0);
      expect(settlements).toHaveLength(0);
    });

    it('applies partial payments and keeps the remaining settlement', () => {
      const { balances, settlements } = calculateBalancesAndSettlements(
        members,
        expenses,
        [{ from: '2', to: '1', amount: 20 }],
      );
      expect(balances['1']).toBe(30);
      expect(balances['2']).toBe(-30);
      expect(settlements).toEqual([{ from: '2', to: '1', amount: 30 }]);
    });

    it('flips the direction when more than the debt is paid', () => {
      const { balances, settlements } = calculateBalancesAndSettlements(
        members,
        expenses,
        [{ from: '2', to: '1', amount: 80 }],
      );
      expect(balances['1']).toBe(-30);
      expect(balances['2']).toBe(30);
      expect(settlements).toEqual([{ from: '1', to: '2', amount: 30 }]);
    });

    it('ignores payments referencing unknown members', () => {
      const { balances } = calculateBalancesAndSettlements(
        members,
        expenses,
        [{ from: 'ghost', to: '1', amount: 50 }],
      );
      expect(balances['1']).toBe(50);
      expect(balances['2']).toBe(-50);
    });

    it('should completely settle a debtor when they pay their displayed whole-dollar balance', () => {
      // 100 split among A, B, C:
      // Exact cents: A (+66.66), B (-33.33), C (-33.33)
      // Rounded balances: A: 67, B: -34, C: -33
      // When B pays their rounded debt of $34 to A, B should be completely settled (0).
      const members: Member[] = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Charlie' },
      ];
      const expenses: Expense[] = [
        { id: 'e1', description: 'Uneven Dinner', amount: 100, paidBy: '1', splitAmong: ['1', '2', '3'] },
      ];

      const { balances, settlements } = calculateBalancesAndSettlements(
        members,
        expenses,
        [{ from: '2', to: '1', amount: 34 }], // Bob pays Alice $34
      );

      expect(balances['2']).toBe(0); // Bob is completely settled!
      expect(balances['1']).toBe(33); // Alice has $33 remaining credit
      expect(balances['3']).toBe(-33); // Charlie has $33 remaining debt

      expect(settlements).toEqual([{ from: '3', to: '1', amount: 33 }]); // Only Charlie pays Alice
    });
  });

  it('should produce whole-dollar balances and settlements that sum exactly', () => {
    // Regression: previously settlements could be 33.33333... due to float math.
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Charlie' },
      { id: '4', name: 'Dave' },
    ];
    const expenses: Expense[] = [
      { id: 'e1', description: '', amount: 100, paidBy: '1', splitAmong: ['1', '2', '3'] },
      { id: 'e2', description: '', amount: 55.55, paidBy: '2', splitAmong: ['1', '2', '4'] },
      { id: 'e3', description: '', amount: 7.77, paidBy: '3', splitAmong: ['2', '3', '4'] },
    ];

    const { balances, settlements } = calculateBalancesAndSettlements(members, expenses);

    Object.values(balances).forEach(b => {
      expect(Number.isInteger(b)).toBe(true);
    });
    settlements.forEach(s => {
      expect(Number.isInteger(s.amount)).toBe(true);
    });

    // Balances sum to zero exactly.
    const balanceSum = Object.values(balances).reduce((a, b) => a + b, 0);
    expect(balanceSum).toBe(0);

    // For each member, their outgoing minus incoming settlements equals their (negated) balance.
    members.forEach(m => {
      const incoming = settlements.filter(s => s.to === m.id).reduce((a, s) => a + s.amount, 0);
      const outgoing = settlements.filter(s => s.from === m.id).reduce((a, s) => a + s.amount, 0);
      expect(incoming - outgoing).toBe(balances[m.id]);
    });
  });

  it('should guarantee rounded balances sum to exactly zero when there are more creditors than debtors', () => {
    // Regression: 3 creditors owed $1.50 each and 1 debtor owing $4.50.
    // Initial rounded would be: +2, +2, +2, -4 -> diff = +2.
    // Since there is only 1 debtor (Dave), the old algorithm adjusted Dave to -5 and stopped,
    // leaving the sum at +1. The Largest Remainder Method handles this perfectly.
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Charlie' },
      { id: '4', name: 'Dave' },
    ];
    const expenses: Expense[] = [
      { id: 'e1', description: 'Alice paid for Dave', amount: 1.50, paidBy: '1', splitAmong: ['4'] },
      { id: 'e2', description: 'Bob paid for Dave', amount: 1.50, paidBy: '2', splitAmong: ['4'] },
      { id: 'e3', description: 'Charlie paid for Dave', amount: 1.50, paidBy: '3', splitAmong: ['4'] },
    ];

    const { balances, settlements } = calculateBalancesAndSettlements(members, expenses);

    // Sum of rounded balances must be exactly 0
    const balanceSum = Object.values(balances).reduce((a, b) => a + b, 0);
    expect(balanceSum).toBe(0);

    // Verify all balances are integers
    Object.values(balances).forEach(b => {
      expect(Number.isInteger(b)).toBe(true);
    });

    // Verify settlements sum and match the individual balances perfectly
    members.forEach(m => {
      const incoming = settlements.filter(s => s.to === m.id).reduce((a, s) => a + s.amount, 0);
      const outgoing = settlements.filter(s => s.from === m.id).reduce((a, s) => a + s.amount, 0);
      expect(incoming - outgoing).toBe(balances[m.id]);
    });
  });

  describe('SLICE Product Guarantees', () => {
    it('satisfies the three core product goals: minimal transactions, cents-snapping, and 0-balance settled user exclusion', () => {
      // Members: Alice ('1'), Bob ('2'), Charlie ('3'), Dave ('4')
      const members: Member[] = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Charlie' },
        { id: '4', name: 'Dave' },
      ];

      // --- STEP 1: Initial Uneven Expense ---
      // Alice paid $100 split evenly among Alice, Bob, and Charlie.
      // Exact share: $33.333... each.
      // Bob: -$33.33 (display rounded to -$34)
      // Charlie: -$33.33 (display rounded to -$33)
      // Alice: +$66.66 (display rounded to +$67)
      let expenses: Expense[] = [
        { id: 'e1', description: 'Uneven Dinner', amount: 100, paidBy: '1', splitAmong: ['1', '2', '3'] },
      ];

      let completedSettlements: CompletedSettlement[] = [];

      let result = calculateBalancesAndSettlements(members, expenses, completedSettlements);
      expect(result.balances['2']).toBe(-34); // Bob owes 34
      expect(result.balances['3']).toBe(-33); // Charlie owes 33
      expect(result.balances['1']).toBe(67);  // Alice receives 67

      // Guarantee 1: Minimal transactions (A pays B, C pays B, etc.)
      // Bob and Charlie both pay Alice.
      expect(result.settlements).toHaveLength(2);
      expect(result.settlements).toContainEqual({ from: '2', to: '1', amount: 34 });
      expect(result.settlements).toContainEqual({ from: '3', to: '1', amount: 33 });

      // --- STEP 2: Bob settles his debt ---
      // Bob pays $34 to Alice.
      completedSettlements.push({ from: '2', to: '1', amount: 34 });

      result = calculateBalancesAndSettlements(members, expenses, completedSettlements);

      // Guarantee 2: Cents-snapping (Bob is exactly 0, not +$1)
      expect(result.balances['2']).toBe(0); // Bob is fully settled!
      expect(result.balances['3']).toBe(-33); // Charlie still owes 33
      expect(result.balances['1']).toBe(33); // Alice receives 33

      // Bob must be completely excluded from suggested settlements
      expect(result.settlements).toEqual([{ from: '3', to: '1', amount: 33 }]);

      // --- STEP 3: Unrelated expense added (Dave and Alice) ---
      // Alice pays $50 split evenly between Alice and Dave ($25 each).
      // Bob and Charlie are NOT in this split.
      expenses.push({ id: 'e2', description: 'Unrelated taxi', amount: 50, paidBy: '1', splitAmong: ['1', '4'] });

      result = calculateBalancesAndSettlements(members, expenses, completedSettlements);

      // Guarantee 3: 0-balance exclusion (Bob remains untouched at 0, no transactions for Bob!)
      expect(result.balances['2']).toBe(0); // Bob remains completely untouched at 0!
      expect(result.balances['3']).toBe(-33); // Charlie remains at -33
      expect(result.balances['4']).toBe(-25); // Dave owes 25
      expect(result.balances['1']).toBe(33 + 25); // Alice receives 58

      // Suggested settlements should only involve Charlie -> Alice and Dave -> Alice.
      // Bob is NOT involved.
      expect(result.settlements).toHaveLength(2);
      expect(result.settlements).toContainEqual({ from: '3', to: '1', amount: 33 });
      expect(result.settlements).toContainEqual({ from: '4', to: '1', amount: 25 });
      expect(result.settlements.some(s => s.from === '2' || s.to === '2')).toBe(false); // Bob is completely excluded!
    });
  });

  it('should calculate correct whole-dollar balances and settlements when A pays 200 and only B and C split it', () => {
    // A paid 200, split between B and C (A is not in the split).
    // B's share: 100, C's share: 100.
    // Together, B and C should pay a total of 200 to settle.
    const members: Member[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Charlie' },
    ];
    const expenses: Expense[] = [
      { id: 'e1', description: 'treating B and C', amount: 200, paidBy: '1', splitAmong: ['2', '3'] },
    ];

    const { balances, settlements } = calculateBalancesAndSettlements(members, expenses);

    // Alice should receive 200
    expect(balances['1']).toBe(200);
    // Bob should owe 100
    expect(balances['2']).toBe(-100);
    // Charlie should owe 100
    expect(balances['3']).toBe(-100);

    // Suggested settlements should sum to 200 exactly
    expect(settlements).toHaveLength(2);
    expect(settlements).toContainEqual({ from: '2', to: '1', amount: 100 });
    expect(settlements).toContainEqual({ from: '3', to: '1', amount: 100 });

    const totalSettledAmount = settlements.reduce((sum, s) => sum + s.amount, 0);
    expect(totalSettledAmount).toBe(200);
  });
});
