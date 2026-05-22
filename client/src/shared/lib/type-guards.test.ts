import { describe, expect, it } from 'vitest';

import { isRecord } from './type-guards';

describe('isRecord', () => {
  it('accepts plain objects', () => {
    expect(isRecord({ value: 1 })).toBe(true);
  });

  it('rejects null and arrays', () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord(['value'])).toBe(false);
  });
});
