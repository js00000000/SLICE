import { describe, it, expect } from 'vitest';
import type { Expense, Payment } from '../types';
import { getPayers, resolvePayerDisplay } from './payers';

const makeExpense = (overrides: Partial<Expense>): Expense => ({
  id: 'e1',
  description: 'Dinner',
  amount: 100,
  paidBy: '',
  splitAmong: [],
  createdBy: 'u1',
  ...overrides,
});

describe('getPayers', () => {
  it('uses payments[] when present (v2 multi-payer shape)', () => {
    const payments: Payment[] = [
      { memberId: 'a', amount: 60 },
      { memberId: 'b', amount: 40 },
    ];
    expect(getPayers(makeExpense({ payments, paidBy: 'a' }))).toEqual(payments);
  });

  it('falls back to paidBy with the full amount (legacy shape)', () => {
    expect(getPayers(makeExpense({ paidBy: 'a', amount: 100 }))).toEqual([
      { memberId: 'a', amount: 100 },
    ]);
  });

  it('coerces a string amount when falling back to paidBy', () => {
    expect(getPayers(makeExpense({ paidBy: 'a', amount: '100' as unknown as number }))).toEqual([
      { memberId: 'a', amount: 100 },
    ]);
  });

  it('returns an empty array when there are no payers', () => {
    expect(getPayers(makeExpense({ paidBy: '' }))).toEqual([]);
  });

  it('prefers payments[] even when paidBy is also set', () => {
    const payments: Payment[] = [{ memberId: 'b', amount: 100 }];
    expect(getPayers(makeExpense({ payments, paidBy: 'a' }))).toEqual(payments);
  });
});

describe('resolvePayerDisplay', () => {
  const pay = (...ids: string[]): Payment[] => ids.map(id => ({ memberId: id, amount: 20 }));
  const many = pay('aa', 'bb', 'cc', 'dd', 'me');

  describe('with three or more payers (two names + "+N")', () => {
    it('surfaces the current user first, then the next payer, then "+N"', () => {
      expect(resolvePayerDisplay(many, 'me', null)).toEqual({
        displayPayerIds: ['me', 'aa'],
        overflowCount: 3,
      });
    });

    it('surfaces the filtered member first when a filter is active', () => {
      expect(resolvePayerDisplay(many, null, 'aa')).toEqual({
        displayPayerIds: ['aa', 'bb'],
        overflowCount: 3,
      });
    });

    it('lets the filter win even when the current user is also a payer', () => {
      expect(resolvePayerDisplay(many, 'me', 'aa')).toEqual({
        displayPayerIds: ['aa', 'bb'],
        overflowCount: 3,
      });
    });

    it('falls back to the first two payers when the current user is not a payer', () => {
      expect(resolvePayerDisplay(many, 'someone-else', null)).toEqual({
        displayPayerIds: ['aa', 'bb'],
        overflowCount: 3,
      });
    });

    it('ignores a filter that does not match any payer', () => {
      expect(resolvePayerDisplay(many, 'me', 'not-a-payer')).toEqual({
        displayPayerIds: ['me', 'aa'],
        overflowCount: 3,
      });
    });

    it('shows exactly two names and "+1" for three payers', () => {
      expect(resolvePayerDisplay(pay('aa', 'bb', 'cc'), null, null)).toEqual({
        displayPayerIds: ['aa', 'bb'],
        overflowCount: 1,
      });
    });
  });

  describe('with two payers (show both names, no "+N")', () => {
    it('orders the primary (current user) first', () => {
      expect(resolvePayerDisplay(pay('aa', 'me'), 'me', null)).toEqual({
        displayPayerIds: ['me', 'aa'],
        overflowCount: 0,
      });
    });

    it('orders the primary (filtered member) first', () => {
      expect(resolvePayerDisplay(pay('aa', 'bb'), null, 'bb')).toEqual({
        displayPayerIds: ['bb', 'aa'],
        overflowCount: 0,
      });
    });

    it('keeps original order when no payer is primary', () => {
      expect(resolvePayerDisplay(pay('aa', 'bb'), 'someone-else', null)).toEqual({
        displayPayerIds: ['aa', 'bb'],
        overflowCount: 0,
      });
    });
  });

  it('shows the single payer with no overflow', () => {
    expect(resolvePayerDisplay(pay('aa'), 'me', null)).toEqual({
      displayPayerIds: ['aa'],
      overflowCount: 0,
    });
  });

  it('returns nothing when there are no payers', () => {
    expect(resolvePayerDisplay([], 'me', null)).toEqual({
      displayPayerIds: [],
      overflowCount: 0,
    });
  });
});
