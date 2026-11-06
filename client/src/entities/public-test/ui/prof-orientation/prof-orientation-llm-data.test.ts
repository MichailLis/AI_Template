import { describe, expect, it } from 'vitest';

import pairedRulesVectors from '../../../../../../template/paired-rules.vectors.json';

import { getProfOrientationLlmStatus } from './prof-orientation-llm-data';

describe('getProfOrientationLlmStatus', () => {
  it.each(pairedRulesVectors.vectors.getProfOrientationLlmStatus)(
    'satisfies shared vector: $description',
    ({ input, expected }) => {
      expect(getProfOrientationLlmStatus(input)).toBe(expected);
    },
  );
});
