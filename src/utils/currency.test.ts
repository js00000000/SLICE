import { describe, it, expect } from 'vitest';
import {
  getDefaultCurrency,
  getGroupCurrencies,
  buildRateMap,
  getExpenseRate,
  convertToDefault,
  isForeignExpense,
  validateCurrencyCode,
  recomputeCurrenciesForNewDefault,
} from './currency';

const multiGroup = {
  defaultCurrency: 'TWD',
  currencies: [
    { code: 'TWD', rate: 1 },
    { code: 'JPY', rate: 0.21 },
    { code: '日圓', rate: 0.21 },
  ],
};

describe('Currency Utilities', () => {
  describe('getDefaultCurrency', () => {
    it('falls back to TWD for legacy groups', () => {
      expect(getDefaultCurrency(undefined)).toBe('TWD');
      expect(getDefaultCurrency(null)).toBe('TWD');
      expect(getDefaultCurrency({})).toBe('TWD');
    });

    it('returns the stored default', () => {
      expect(getDefaultCurrency({ defaultCurrency: 'JPY' })).toBe('JPY');
    });
  });

  describe('getGroupCurrencies', () => {
    it('returns a virtual single-entry list for legacy groups', () => {
      expect(getGroupCurrencies(null)).toEqual([{ code: 'TWD', rate: 1 }]);
      expect(getGroupCurrencies({ defaultCurrency: 'USD' })).toEqual([{ code: 'USD', rate: 1 }]);
      expect(getGroupCurrencies({ currencies: [] })).toEqual([{ code: 'TWD', rate: 1 }]);
    });

    it('returns the stored list when present', () => {
      expect(getGroupCurrencies(multiGroup)).toEqual(multiGroup.currencies);
    });
  });

  describe('buildRateMap', () => {
    it('maps codes to rates and forces the default to 1', () => {
      const rates = buildRateMap({
        defaultCurrency: 'TWD',
        currencies: [
          { code: 'TWD', rate: 5 }, // corrupt default rate gets forced back to 1
          { code: 'JPY', rate: 0.21 },
        ],
      });
      expect(rates).toEqual({ TWD: 1, JPY: 0.21 });
    });

    it('skips invalid rates', () => {
      const rates = buildRateMap({
        defaultCurrency: 'TWD',
        currencies: [
          { code: 'TWD', rate: 1 },
          { code: 'BAD', rate: 0 },
          { code: 'NEG', rate: -2 },
          { code: 'NAN', rate: NaN },
        ],
      });
      expect(rates).toEqual({ TWD: 1 });
    });

    it('handles legacy groups', () => {
      expect(buildRateMap(null)).toEqual({ TWD: 1 });
    });
  });

  describe('getExpenseRate', () => {
    it('returns 1 for legacy expenses without a currency', () => {
      expect(getExpenseRate({}, multiGroup)).toBe(1);
    });

    it('returns 1 for default-currency expenses', () => {
      expect(getExpenseRate({ currency: 'TWD' }, multiGroup)).toBe(1);
    });

    it('returns the listed rate for foreign currencies', () => {
      expect(getExpenseRate({ currency: 'JPY' }, multiGroup)).toBe(0.21);
      expect(getExpenseRate({ currency: '日圓' }, multiGroup)).toBe(0.21);
    });

    it('returns 1 for unknown codes', () => {
      expect(getExpenseRate({ currency: 'XXX' }, multiGroup)).toBe(1);
    });
  });

  describe('convertToDefault', () => {
    it('multiplies amount by rate', () => {
      expect(convertToDefault(1200, 0.21)).toBeCloseTo(252, 6);
    });
  });

  describe('isForeignExpense', () => {
    it('is false for legacy and default-currency expenses', () => {
      expect(isForeignExpense({}, multiGroup)).toBe(false);
      expect(isForeignExpense({ currency: 'TWD' }, multiGroup)).toBe(false);
    });

    it('is true when the stamped code differs from the default', () => {
      expect(isForeignExpense({ currency: 'JPY' }, multiGroup)).toBe(true);
      // Stamped code stays foreign even if removed from the list
      expect(isForeignExpense({ currency: 'XXX' }, multiGroup)).toBe(true);
    });
  });

  describe('validateCurrencyCode', () => {
    it('accepts 1–4 trimmed characters', () => {
      expect(validateCurrencyCode('JPY')).toBe(true);
      expect(validateCurrencyCode(' 日圓 ')).toBe(true);
      expect(validateCurrencyCode('USDT')).toBe(true);
    });

    it('rejects empty and too-long codes', () => {
      expect(validateCurrencyCode('')).toBe(false);
      expect(validateCurrencyCode('   ')).toBe(false);
      expect(validateCurrencyCode('POINT')).toBe(false);
    });
  });

  describe('recomputeCurrenciesForNewDefault', () => {
    const currencies = [
      { code: 'TWD', rate: 1 },
      { code: 'JPY', rate: 0.21 },
      { code: 'USD', rate: 31.5 },
    ];

    it('rebases all rates onto the new default', () => {
      const result = recomputeCurrenciesForNewDefault(currencies, 'JPY');
      expect(result).toEqual([
        { code: 'TWD', rate: Math.round((1 / 0.21) * 1e6) / 1e6 }, // ≈ 4.761905
        { code: 'JPY', rate: 1 },
        { code: 'USD', rate: 150 },
      ]);
    });

    it('lands the new default at exactly 1', () => {
      const result = recomputeCurrenciesForNewDefault(currencies, 'USD');
      expect(result.find(c => c.code === 'USD')?.rate).toBe(1);
      expect(result.find(c => c.code === 'TWD')?.rate).toBeCloseTo(1 / 31.5, 6);
    });

    it('is a no-op when the new default equals the current default', () => {
      expect(recomputeCurrenciesForNewDefault(currencies, 'TWD')).toEqual(currencies);
    });

    it('returns the input unchanged for unknown or invalid targets', () => {
      expect(recomputeCurrenciesForNewDefault(currencies, 'XXX')).toEqual(currencies);
      expect(
        recomputeCurrenciesForNewDefault([{ code: 'BAD', rate: 0 }], 'BAD'),
      ).toEqual([{ code: 'BAD', rate: 0 }]);
    });

    it('rounds rebased rates to 6 decimals', () => {
      const result = recomputeCurrenciesForNewDefault(
        [
          { code: 'TWD', rate: 1 },
          { code: 'JPY', rate: 0.21 },
        ],
        'JPY',
      );
      expect(result.find(c => c.code === 'TWD')?.rate).toBe(4.761905);
    });
  });
});
