import { describe, expect, it } from 'vitest';

import { getMaxChoices, isChoiceLimitReached } from './public-question-choice-limit';

describe('getMaxChoices', () => {
  it('reads a positive cap from question settings', () => {
    expect(getMaxChoices({ maxChoices: 3 })).toBe(3);
  });

  it('floors a fractional cap rather than trusting it verbatim', () => {
    expect(getMaxChoices({ maxChoices: 2.7 })).toBe(2);
  });

  it.each([
    ['missing settings', undefined],
    ['null settings', null],
    ['a primitive', 'maxChoices=2'],
    ['no cap in settings', { other: 1 }],
    ['a non-numeric cap', { maxChoices: '2' }],
    ['a zero cap', { maxChoices: 0 }],
    ['a negative cap', { maxChoices: -1 }],
    ['a NaN cap', { maxChoices: Number.NaN }],
  ])('returns null for %s', (_label, settings) => {
    expect(getMaxChoices(settings)).toBeNull();
  });
});

describe('isChoiceLimitReached', () => {
  it('is never reached without a cap', () => {
    expect(isChoiceLimitReached(99, null)).toBe(false);
  });

  it('is reached at the cap and beyond', () => {
    expect(isChoiceLimitReached(1, 2)).toBe(false);
    expect(isChoiceLimitReached(2, 2)).toBe(true);
    expect(isChoiceLimitReached(3, 2)).toBe(true);
  });
});
