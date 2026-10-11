import { getCurrentScheduleSlot, getNextScheduledRun } from './backup-settings.service';

const settings = { scheduleEnabled: true, scheduleHourUtc: 3, retentionDays: 14, maxCount: 30 };

describe('schedule slots', () => {
  it('uses today when the hour has already come', () => {
    expect(getCurrentScheduleSlot(settings, new Date('2026-10-11T03:00:00Z')).toISOString()).toBe(
      '2026-10-11T03:00:00.000Z',
    );
  });

  it('uses yesterday before the hour', () => {
    expect(getCurrentScheduleSlot(settings, new Date('2026-10-11T02:59:00Z')).toISOString()).toBe(
      '2026-10-10T03:00:00.000Z',
    );
  });

  it('points the next run at the following slot', () => {
    expect(getNextScheduledRun(settings, new Date('2026-10-11T02:59:00Z'))?.toISOString()).toBe(
      '2026-10-11T03:00:00.000Z',
    );
    expect(getNextScheduledRun(settings, new Date('2026-10-11T15:00:00Z'))?.toISOString()).toBe(
      '2026-10-12T03:00:00.000Z',
    );
  });

  it('has no next run when the schedule is off', () => {
    expect(getNextScheduledRun({ ...settings, scheduleEnabled: false }, new Date())).toBeNull();
  });
});
