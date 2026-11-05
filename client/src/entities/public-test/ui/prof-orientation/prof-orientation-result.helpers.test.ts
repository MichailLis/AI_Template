import { describe, expect, it } from 'vitest';

import pairedRulesVectors from '../../../../../../template/paired-rules.vectors.json';

import { normalizeProfessionTitle } from './prof-orientation-result.helpers';

describe('prof-orientation result helpers', () => {
  describe('shared paired-rules normalizeProfessionTitle vectors', () => {
    it.each(pairedRulesVectors.vectors.normalizeProfessionTitle)(
      'satisfies shared vector: $description',
      ({ input, expected }) => {
        expect(normalizeProfessionTitle(input)).toBe(expected);
      },
    );
  });
});
