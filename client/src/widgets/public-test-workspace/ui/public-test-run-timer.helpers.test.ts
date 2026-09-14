import { describe, expect, it } from 'vitest';

import {
  formatRemainingTime,
  getRemainingSeconds,
  isPublicTestTimeWarning,
} from './public-test-run-timer.helpers';

describe('getRemainingSeconds', () => {
  const nowMs = Date.parse('2026-09-13T10:00:00.000Z');

  it('has nothing to count for an attempt without a time limit', () => {
    expect(getRemainingSeconds(null, nowMs)).toBeNull();
  });

  it('rounds up so the clock shows 0:00 only when the time is really over', () => {
    expect(getRemainingSeconds('2026-09-13T10:04:05.000Z', nowMs)).toBe(245);
    expect(getRemainingSeconds('2026-09-13T10:00:00.400Z', nowMs)).toBe(1);
  });

  it('never goes below zero after the limit', () => {
    expect(getRemainingSeconds('2026-09-13T09:59:00.000Z', nowMs)).toBe(0);
  });

  it('calibrates remaining seconds by clock skew between browser and server', () => {
    const clientNowMs = Date.parse('2026-09-13T10:03:00.000Z');
    const clockSkewMs = 3 * 60_000;
    const expiresAt = '2026-09-13T10:05:00.000Z';

    expect(getRemainingSeconds(expiresAt, clientNowMs, 0)).toBe(120);
    expect(getRemainingSeconds(expiresAt, clientNowMs, clockSkewMs)).toBe(300);
  });
});

describe('formatRemainingTime', () => {
  it('shows minutes and seconds', () => {
    expect(formatRemainingTime(245)).toBe('4:05');
    expect(formatRemainingTime(0)).toBe('0:00');
  });

  it('adds hours for long limits', () => {
    expect(formatRemainingTime(3725)).toBe('1:02:05');
  });
});

describe('isPublicTestTimeWarning', () => {
  it('warns during the last minute only', () => {
    expect(isPublicTestTimeWarning(61)).toBe(false);
    expect(isPublicTestTimeWarning(60)).toBe(true);
    expect(isPublicTestTimeWarning(null)).toBe(false);
  });
});
