import {
  formatInTimeZone,
  getZonedDayEnd,
  getZonedDayStart,
  resolveTimeZone,
  toZonedWallClock,
} from './time-zone';

describe('time-zone', () => {
  it('falls back to UTC for missing or unknown zones', () => {
    expect(resolveTimeZone(undefined)).toBe('UTC');
    expect(resolveTimeZone('Mars/Olympus')).toBe('UTC');
    expect(resolveTimeZone('Europe/Moscow')).toBe('Europe/Moscow');
  });

  it('takes the local day, not the UTC day', () => {
    expect(getZonedDayStart('2026-10-12', 'Asia/Novosibirsk').toISOString()).toBe(
      '2026-10-11T17:00:00.000Z',
    );
    expect(getZonedDayEnd('2026-10-12', 'Asia/Novosibirsk').toISOString()).toBe(
      '2026-10-12T16:59:59.999Z',
    );
    expect(getZonedDayStart('2026-10-12', 'UTC').toISOString()).toBe('2026-10-12T00:00:00.000Z');
  });

  it('handles zones west of UTC and DST days', () => {
    expect(getZonedDayStart('2026-07-01', 'America/New_York').toISOString()).toBe(
      '2026-07-01T04:00:00.000Z',
    );
    expect(getZonedDayStart('2026-11-01', 'America/New_York').toISOString()).toBe(
      '2026-11-01T04:00:00.000Z',
    );
    expect(getZonedDayEnd('2026-11-01', 'America/New_York').toISOString()).toBe(
      '2026-11-02T04:59:59.999Z',
    );
  });

  it('shows 06:00 UTC as 09:00 in Moscow', () => {
    const instant = new Date('2026-10-12T06:00:00.000Z');

    expect(toZonedWallClock(instant, 'Europe/Moscow').toISOString()).toBe(
      '2026-10-12T09:00:00.000Z',
    );
    expect(formatInTimeZone(instant, 'Europe/Moscow')).toContain('09:00');
  });
});
