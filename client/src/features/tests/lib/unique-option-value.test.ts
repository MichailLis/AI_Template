import { describe, expect, it } from 'vitest';

import { getUniqueOptionValue } from './unique-option-value';

describe('getUniqueOptionValue', () => {
  it('uses proposed value when not in usedValues', () => {
    const usedValues = new Set<string>();

    const result = getUniqueOptionValue('first_option', usedValues, 0);

    expect(result).toBe('first_option');
    expect(usedValues.has('first_option')).toBe(true);
  });

  it('falls back to option_<index+1> when proposed value is empty', () => {
    const usedValues = new Set<string>();

    const result = getUniqueOptionValue('', usedValues, 2);

    expect(result).toBe('option_3');
    expect(usedValues.has('option_3')).toBe(true);
  });

  it('resolves collision by appending _2, _3, etc.', () => {
    const usedValues = new Set<string>(['answer']);

    const first = getUniqueOptionValue('answer', usedValues, 0);
    expect(first).toBe('answer_2');
    expect(usedValues.has('answer_2')).toBe(true);

    const second = getUniqueOptionValue('answer', usedValues, 1);
    expect(second).toBe('answer_3');
    expect(usedValues.has('answer_3')).toBe(true);
  });

  it('handles empty value collisions', () => {
    const usedValues = new Set<string>(['option_1']);

    const result = getUniqueOptionValue('', usedValues, 0);
    expect(result).toBe('option_1_2');
    expect(usedValues.has('option_1_2')).toBe(true);
  });
});
