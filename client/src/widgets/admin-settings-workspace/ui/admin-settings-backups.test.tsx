import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BackupsSettingsCard } from './admin-settings-backups';
import {
  formatBackupSize,
  formatScheduleHour,
  getBackupAuthorLabel,
  shouldPollBackups,
} from './admin-settings-backups.model';

import type { BackupsOverview } from './admin-settings-backups.model';

const createBackup = vi.fn();
const deleteBackup = vi.fn();
const createDownloadLink = vi.fn();
const updateSettings = vi.fn();
let overview: BackupsOverview;
let downloadLinkOptions: { mutation: { onSuccess: (link: { path: string }) => void } };

vi.mock('@/shared/api/api', () => ({
  buildApiUrl: (path: string) => `http://api.test${path}`,
}));

vi.mock('@/shared/api/generated/admin/admin', () => ({
  getAdminBackupsControllerGetOverviewQueryKey: () => ['backups'],
  useAdminBackupsControllerGetOverview: () => ({
    data: overview,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useAdminBackupsControllerCreateBackup: () => ({ mutate: createBackup, isPending: false }),
  useAdminBackupsControllerDeleteBackup: () => ({ mutate: deleteBackup, isPending: false }),
  useAdminBackupsControllerUpdateSettings: () => ({ mutate: updateSettings, isPending: false }),
  useAdminBackupsControllerCreateDownloadLink: (options: typeof downloadLinkOptions) => {
    downloadLinkOptions = options;

    return { mutate: createDownloadLink, isPending: false };
  },
}));

const readyBackup = {
  id: 'backup-20261011T100000Z-abcdef',
  fileName: 'backup-20261011T100000Z-abcdef.dump',
  status: 'READY' as const,
  trigger: 'MANUAL' as const,
  createdAt: '2026-10-11T10:00:00.000Z',
  completedAt: '2026-10-11T10:00:05.000Z',
  sizeBytes: 5 * 1024 * 1024,
  sha256: 'a'.repeat(64),
  errorMessage: null,
  createdBy: { id: 1, email: 'admin@example.com', name: 'Администратор' },
};

const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <BackupsSettingsCard />
    </QueryClientProvider>,
  );

describe('BackupsSettingsCard', () => {
  beforeEach(() => {
    overview = {
      availability: {
        available: true,
        reason: null,
        pgDumpVersion: 'pg_dump (PostgreSQL) 16.4',
        serverVersion: '16.4',
      },
      settings: { scheduleEnabled: true, scheduleHourUtc: 3, retentionDays: 14, maxCount: 30 },
      nextScheduledAt: '2026-10-12T03:00:00.000Z',
      isBusy: false,
      backups: [readyBackup],
    };
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('lists backups and starts a new one', () => {
    renderCard();

    expect(screen.getByText('Готова')).toBeTruthy();
    expect(screen.getByText('5,0 МБ · Администратор')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Создать копию' }));

    expect(createBackup).toHaveBeenCalledTimes(1);
  });

  it('downloads through the one-time link', () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Скачать' }));
    expect(createDownloadLink).toHaveBeenCalledWith({ id: readyBackup.id });

    downloadLinkOptions.mutation.onSuccess({ path: '/admin/backups/download/token' });

    const anchor = click.mock.instances[0] as unknown as HTMLAnchorElement;
    expect(anchor.href).toBe('http://api.test/admin/backups/download/token');
    click.mockRestore();
  });

  it('asks for confirmation before deleting', () => {
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: `Удалить копию ${readyBackup.fileName}` }));
    expect(deleteBackup).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(deleteBackup).toHaveBeenCalledWith({ id: readyBackup.id });
  });

  it('explains why backups are unavailable and blocks creation', () => {
    overview = {
      ...overview,
      availability: {
        available: false,
        reason: 'pg_dump не установлен в контейнере backend',
        pgDumpVersion: null,
        serverVersion: '16.4',
      },
      backups: [],
    };
    renderCard();

    expect(
      screen.getByText(
        'Резервное копирование недоступно: pg_dump не установлен в контейнере backend',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Копий пока нет')).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Создать копию' }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('blocks a second backup while one is running', () => {
    overview = {
      ...overview,
      isBusy: true,
      backups: [{ ...readyBackup, status: 'RUNNING', sizeBytes: null, sha256: null }],
    };
    renderCard();

    expect(
      (screen.getByRole('button', { name: 'Копия создается...' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect((screen.getByRole('button', { name: 'Скачать' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});

describe('BackupScheduleForm', () => {
  beforeEach(() => {
    overview = {
      availability: { available: true, reason: null, pgDumpVersion: null, serverVersion: null },
      settings: { scheduleEnabled: true, scheduleHourUtc: 3, retentionDays: 14, maxCount: 30 },
      nextScheduledAt: '2026-10-12T03:00:00.000Z',
      isBusy: false,
      backups: [],
    };
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('saves only after a change and sends the whole settings object', () => {
    renderCard();

    const save = screen.getByRole('button', { name: 'Сохранить' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    expect(screen.getByText(/Следующая автоматическая копия/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Время запуска'), { target: { value: '22' } });
    fireEvent.change(screen.getByLabelText('Хранить, дней'), { target: { value: '30' } });
    fireEvent.click(save);

    expect(updateSettings).toHaveBeenCalledWith({
      data: { scheduleEnabled: true, scheduleHourUtc: 22, retentionDays: 30, maxCount: 30 },
    });
  });

  it('turns the schedule off with the switch', () => {
    renderCard();

    fireEvent.click(
      screen.getByRole('switch', { name: 'Создавать копию автоматически каждый день' }),
    );
    expect((screen.getByLabelText('Время запуска') as HTMLSelectElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(updateSettings).toHaveBeenCalledWith({
      data: expect.objectContaining({ scheduleEnabled: false }) as unknown,
    });
  });
});

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
        settings: { scheduleEnabled: true, scheduleHourUtc: 3, retentionDays: 14, maxCount: 30 },
        nextScheduledAt: '2026-10-12T03:00:00.000Z',
        isBusy: false,
        backups: [{ ...readyBackup, status: 'RUNNING' }],
      }),
    ).toBe(true);
  });
});
