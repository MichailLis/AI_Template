import { describe, expect, it } from 'vitest';

import {
  ATTEMPTS_LIMIT,
  readLimit,
  readNumber,
  readTab,
  resolveAnalyticsTab,
} from './use-admin-public-links-stats-workspace.model';

describe('analytics selection read from the query string', () => {
  it('keeps the active scope unless the archive is explicitly requested', () => {
    expect(readTab('archived')).toBe('archived');
    expect(readTab('active')).toBe('active');
    expect(readTab(null)).toBe('active');
    expect(readTab('что-то')).toBe('active');
  });

  it('accepts only positive integers as identifiers', () => {
    expect(readNumber('1007')).toBe(1007);
    expect(readNumber('0')).toBeNull();
    expect(readNumber('-4')).toBeNull();
    expect(readNumber('abc')).toBeNull();
    expect(readNumber(null)).toBeNull();
  });

  it('falls back to the default page size for values outside the offered options', () => {
    expect(readLimit('25')).toBe(25);
    expect(readLimit('50')).toBe(50);
    expect(readLimit('1000')).toBe(ATTEMPTS_LIMIT);
    expect(readLimit(null)).toBe(ATTEMPTS_LIMIT);
  });

  it('opens the report tab for anything but the attempts value', () => {
    expect(resolveAnalyticsTab('attempts')).toBe('attempts');
    expect(resolveAnalyticsTab('report')).toBe('report');
    expect(resolveAnalyticsTab(null)).toBe('report');
  });
});
