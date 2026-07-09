import { describe, expect, it } from 'vitest';

import {
  initialDemographicFormState,
  initialFormState,
  normalizeInitial,
  resolveGroupValidationWarning,
} from './public-test-entry.helpers';

describe('public test entry helpers', () => {
  it('requires explicit consent by default for public test start', () => {
    expect(initialFormState.consentAccepted).toBe(false);
    expect(initialDemographicFormState.consentAccepted).toBe(false);
  });

  it('normalizes initials by trimming, taking the first symbol, and uppercasing it', () => {
    expect(normalizeInitial(' иван')).toBe('И');
    expect(normalizeInitial('qwerty')).toBe('Q');
  });

  it('returns no group validation warning when validation is disabled or value matches', () => {
    expect(
      resolveGroupValidationWarning({
        groupValue: 'ИС-21',
        groupValidationMode: 'NONE',
        groupValidationPattern: '^ИС-\\d+$',
        groupValidationHint: 'Use ИС-21',
      }),
    ).toBeNull();

    expect(
      resolveGroupValidationWarning({
        groupValue: 'ИС-21',
        groupValidationMode: 'STRICT',
        groupValidationPattern: '^ИС-\\d+$',
        groupValidationHint: 'Use ИС-21',
      }),
    ).toBeNull();
  });

  it('uses the configured warning for non-matching group values and ignores invalid regexes', () => {
    expect(
      resolveGroupValidationWarning({
        groupValue: 'БИ-21',
        groupValidationMode: 'HINT',
        groupValidationPattern: '^ИС-\\d+$',
        groupValidationHint: 'Use ИС-21',
      }),
    ).toBe('Use ИС-21');

    expect(
      resolveGroupValidationWarning({
        groupValue: 'БИ-21',
        groupValidationMode: 'STRICT',
        groupValidationPattern: '[',
        groupValidationHint: 'Use ИС-21',
      }),
    ).toBeNull();
  });
});
