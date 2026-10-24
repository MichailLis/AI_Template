import pairedRulesVectors from '../../../../template/paired-rules.vectors.json';

import { isValidInn, isValidOgrn } from './organization-requisites';

describe('organization requisites', () => {
  describe('shared paired-rules isValidInn vectors', () => {
    it.each(pairedRulesVectors.vectors.isValidInn)(
      'satisfies shared vector: $description',
      ({ input, expected }) => {
        expect(isValidInn(input)).toBe(expected);
      },
    );
  });

  describe('shared paired-rules isValidOgrn vectors', () => {
    it.each(pairedRulesVectors.vectors.isValidOgrn)(
      'satisfies shared vector: $description',
      ({ input, expected }) => {
        expect(isValidOgrn(input)).toBe(expected);
      },
    );
  });
});
