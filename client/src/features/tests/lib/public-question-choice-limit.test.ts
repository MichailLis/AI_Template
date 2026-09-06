import { describe, expect, it } from 'vitest';

import pairedRulesVectors from '../../../../../template/paired-rules.vectors.json';

import { getMaxChoices, isChoiceLimitReached } from './public-question-choice-limit';

describe('getMaxChoices', () => {
  it('reads a positive cap from question settings', () => {
    expect(getMaxChoices({ maxChoices: 3 })).toBe(3);
  });

  it.each([
    ['missing settings', undefined],
    ['null settings', null],
    ['an array', []],
    ['a primitive', 'maxChoices=2'],
    ['no cap in settings', { other: 1 }],
    ['a non-numeric cap', { maxChoices: '2' }],
    ['a zero cap', { maxChoices: 0 }],
    ['a negative cap', { maxChoices: -1 }],
    ['a NaN cap', { maxChoices: Number.NaN }],
    ['an infinite cap', { maxChoices: Number.POSITIVE_INFINITY }],
  ])('returns null for %s', (_label, settings) => {
    expect(getMaxChoices(settings)).toBeNull();
  });

  // The server rejects a non-integer cap outright, treating the question as uncapped. Flooring
  // it here would make the UI stricter than the server at 2.5, and a cap below 1 would floor to
  // zero and leave the student unable to answer at all.
  it.each([
    ['a fractional cap above one', { maxChoices: 2.5 }],
    ['a fractional cap below one', { maxChoices: 0.5 }],
  ])('matches the server and ignores %s', (_label, settings) => {
    expect(getMaxChoices(settings)).toBeNull();
  });

  describe('shared paired-rules vectors', () => {
    it.each(pairedRulesVectors.vectors.getMaxChoices)(
      'satisfies shared vector: $description',
      ({ input, expected }) => {
        expect(getMaxChoices(input)).toBe(expected);
      },
    );
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
