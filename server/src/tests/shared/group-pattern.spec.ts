import pairedRulesVectors from '../../../../template/paired-rules.vectors.json';

import { isSafeGroupPattern } from './group-pattern';

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
