import { describe, expect, it } from 'vitest';

import { formatDateTime, formatDateTimeOrDash } from './date-format';

describe('formatDateTime', () => {
  it('formats present date strings through Date.toLocaleString', () => {
    const value = '2026-05-22T10:30:00.000Z';

    expect(formatDateTime(value)).toBe(new Date(value).toLocaleString());
  });
});

describe('formatDateTimeOrDash', () => {
  it('returns a dash for missing values', () => {
    expect(formatDateTimeOrDash(null)).toBe('—');
    expect(formatDateTimeOrDash(undefined)).toBe('—');
  });
});
