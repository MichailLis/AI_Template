import { describe, expect, it } from 'vitest';

import pairedRulesVectors from '../../../../template/paired-rules.vectors.json';

import { isSafeGroupPattern } from './group-validation';

describe('isSafeGroupPattern', () => {
  describe('shared paired-rules isSafeGroupPattern vectors', () => {
    it.each(pairedRulesVectors.vectors.isSafeGroupPattern)(
      'satisfies shared vector: $description',
      ({ input, expected }) => {
        expect(isSafeGroupPattern(input)).toBe(expected);
      },
    );
  });
});
