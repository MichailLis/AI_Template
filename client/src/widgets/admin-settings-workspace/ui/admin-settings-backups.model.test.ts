import { describe, expect, it } from 'vitest';

import {
  formatBackupSize,
  formatScheduleHour,
  getBackupAuthorLabel,
  shouldPollBackups,
} from './admin-settings-backups.model';

import type { BackupItem } from './admin-settings-backups.model';

const readyBackup: BackupItem = {
  id: 'backup-20261011T100000Z-abcdef',
  fileName: 'backup-20261011T100000Z-abcdef.dump',
  status: 'READY',
  trigger: 'MANUAL',
  createdAt: '2026-10-11T10:00:00.000Z',
  completedAt: '2026-10-11T10:00:05.000Z',
  sizeBytes: 5 * 1024 * 1024,
  sha256: 'a'.repeat(64),
  errorMessage: null,
  originalFileName: null,
  createdBy: { id: 1, email: 'admin@example.com', name: 'Администратор' },
};

describe('backups model', () => {
  it.each([
    [null, '—'],
    [512, '512 Б'],
    [1536, '1,5 КБ'],
    [25 * 1024 * 1024, '25 МБ'],
  ])('formats %p as %p', (size, label) => {
    expect(formatBackupSize(size)).toBe(label);
  });

  it('shows the schedule hour in UTC next to local time', () => {
    expect(formatScheduleHour(3)).toMatch(/^\d{2}:00 \(03:00 UTC\)$/);
  });

  it('labels the reason and the author of a backup', () => {
    expect(getBackupAuthorLabel({ ...readyBackup, trigger: 'PRE_RESTORE' })).toBe(
      'Перед восстановлением · Администратор',
    );
  });

  it('labels scheduled backups', () => {
    expect(getBackupAuthorLabel({ ...readyBackup, createdBy: null, trigger: 'SCHEDULED' })).toBe(
      'По расписанию',
    );
  });

  it('polls only while a backup is running', () => {
    expect(shouldPollBackups(undefined)).toBe(false);
    expect(
      shouldPollBackups({
        availability: { available: true, reason: null, pgDumpVersion: null, serverVersion: null },
        storage: { freeBytes: null, usedBytes: 0, databaseBytes: null, lowSpace: false },
        settings: { scheduleEnabled: true, scheduleHourUtc: 3, retentionDays: 14, maxCount: 30 },
        nextScheduledAt: '2026-10-12T03:00:00.000Z',
        isBusy: false,
        backups: [{ ...readyBackup, status: 'RUNNING' }],
      }),
    ).toBe(true);
  });
});
