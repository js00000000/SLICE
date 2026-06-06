import { describe, it, expect } from 'vitest';
import { calculateEvenSplit, isCustomSplit } from './split';
import type { Payment } from '../types';

describe('Split Utilities', () => {
  describe('calculateEvenSplit', () => {
    it('should split cleanly when divisible', () => {
      const result = calculateEvenSplit(12, ['A', 'B', 'C']);
      expect(result).toEqual([
        { memberId: 'A', amount: 4 },
        { memberId: 'B', amount: 4 },
        { memberId: 'C', amount: 4 },
      ]);
    });

    it('should distribute the remainder cents evenly among the first participants', () => {
      const result = calculateEvenSplit(10, ['A', 'B', 'C']);
      // 10.00 / 3 = 3.333... cents
      // 1000 cents / 3 = 333 cents per person + 1 cent remainder
      // First person gets 333 + 1 = 334 cents ($3.34)
      // Second and third get 333 cents ($3.33)
      expect(result).toEqual([
        { memberId: 'A', amount: 3.34 },
        { memberId: 'B', amount: 3.33 },
        { memberId: 'C', amount: 3.33 },
      ]);

      const sum = result.reduce((acc, r) => acc + r.amount, 0);
      expect(sum).toBeCloseTo(10, 2);
    });

    it('should handle zero participants', () => {
      const result = calculateEvenSplit(10, []);
      expect(result).toEqual([]);
    });
  });

  describe('isCustomSplit', () => {
    it('should return false for undefined or empty splits', () => {
      expect(isCustomSplit(undefined)).toBe(false);
      expect(isCustomSplit([])).toBe(false);
    });

    it('should return false for equal split amounts', () => {
      const splits: Payment[] = [
        { memberId: 'A', amount: 50 },
        { memberId: 'B', amount: 50 },
      ];
      expect(isCustomSplit(splits)).toBe(false);
    });

    it('should return false for equal split amounts with 1-cent rounding adjustment', () => {
      const splits: Payment[] = [
        { memberId: 'A', amount: 33.34 },
        { memberId: 'B', amount: 33.33 },
        { memberId: 'C', amount: 33.33 },
      ];
      expect(isCustomSplit(splits)).toBe(false);
    });

    it('should return true for custom split amounts with > 1-cent difference', () => {
      const splits: Payment[] = [
        { memberId: 'A', amount: 60 },
        { memberId: 'B', amount: 40 },
      ];
      expect(isCustomSplit(splits)).toBe(true);
    });
  });
});
