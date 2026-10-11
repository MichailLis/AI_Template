import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BackupsSettingsCard } from './admin-settings-backups';

import type { BackupsOverview } from './admin-settings-backups.model';

const createBackup = vi.fn();
const deleteBackup = vi.fn();
const createDownloadLink = vi.fn();
const updateSettings = vi.fn();
const restoreBackup = vi.fn();
const undoRestore = vi.fn();
const importBackup = vi.fn();
let importOptions: {
  request: { onUploadProgress: (event: { loaded: number; total?: number }) => void };
};
let operationStatus: {
  maintenance: boolean;
  operation: Record<string, unknown> | null;
  previousDatabase: { name: string; restoredAt: string; backupId: string } | null;
};
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
  getAdminBackupsControllerGetOperationQueryKey: () => ['backups-operation'],
  useAdminBackupsControllerGetOperation: () => ({ data: operationStatus }),
  useAdminBackupsControllerRestoreBackup: () => ({ mutate: restoreBackup, isPending: false }),
  useAdminBackupsControllerUndoRestore: () => ({ mutate: undoRestore, isPending: false }),
  useAdminBackupsControllerImportBackup: (options: typeof importOptions) => {
    importOptions = options;

    return { mutate: importBackup, isPending: false };
  },
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
  originalFileName: null,
  createdBy: { id: 1, email: 'admin@example.com', name: 'Администратор' },
};

const makeOverview = (patch: Partial<BackupsOverview>): BackupsOverview => ({
  availability: { available: true, reason: null, pgDumpVersion: null, serverVersion: null },
  storage: {
    freeBytes: 10 * 1024 ** 3,
    usedBytes: 0,
    databaseBytes: 50 * 1024 ** 2,
    lowSpace: false,
  },
  settings: { scheduleEnabled: true, scheduleHourUtc: 3, retentionDays: 14, maxCount: 30 },
  nextScheduledAt: null,
  isBusy: false,
  backups: [],
  ...patch,
});

const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <BackupsSettingsCard />
    </QueryClientProvider>,
  );

describe('BackupsSettingsCard', () => {
  beforeEach(() => {
    operationStatus = { maintenance: false, operation: null, previousDatabase: null };
    overview = makeOverview({
      availability: {
        available: true,
        reason: null,
        pgDumpVersion: 'pg_dump (PostgreSQL) 16.4',
        serverVersion: '16.4',
      },
      nextScheduledAt: '2026-10-12T03:00:00.000Z',
      isBusy: false,
      backups: [readyBackup],
    });
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
    overview = makeOverview({
      ...overview,
      availability: {
        available: false,
        reason: 'pg_dump не установлен в контейнере backend',
        pgDumpVersion: null,
        serverVersion: '16.4',
      },
      backups: [],
    });
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
    overview = makeOverview({
      ...overview,
      isBusy: true,
      backups: [{ ...readyBackup, status: 'RUNNING', sizeBytes: null, sha256: null }],
    });
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
    operationStatus = { maintenance: false, operation: null, previousDatabase: null };
    overview = makeOverview({
      nextScheduledAt: '2026-10-12T03:00:00.000Z',
      isBusy: false,
      backups: [],
    });
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

describe('restore', () => {
  beforeEach(() => {
    operationStatus = { maintenance: false, operation: null, previousDatabase: null };
    overview = makeOverview({
      nextScheduledAt: null,
      isBusy: false,
      backups: [readyBackup],
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('restores only after the confirmation word is typed', () => {
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Восстановить' }));
    const submit = screen.getByRole('button', { name: 'Восстановить' }) as HTMLButtonElement;
    const dialogSubmit = screen
      .getAllByRole('button', { name: 'Восстановить' })
      .find((button) => button.getAttribute('type') === 'submit') as HTMLButtonElement;

    expect(submit).toBeTruthy();
    expect(dialogSubmit.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Для подтверждения введите RESTORE'), {
      target: { value: 'restore' },
    });
    expect(dialogSubmit.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Для подтверждения введите RESTORE'), {
      target: { value: 'RESTORE' },
    });
    fireEvent.click(dialogSubmit);

    expect(restoreBackup).toHaveBeenCalledWith({
      id: readyBackup.id,
      data: { confirmation: 'RESTORE' },
    });
  });

  it('shows progress and blocks new operations while a restore runs', () => {
    operationStatus = {
      maintenance: true,
      operation: {
        kind: 'RESTORE',
        status: 'RUNNING',
        backupId: readyBackup.id,
        fileName: readyBackup.fileName,
        step: 'Развертывание копии во временной базе',
        startedAt: '2026-10-11T10:00:00.000Z',
        finishedAt: null,
        errorMessage: null,
      },
      previousDatabase: null,
    };
    renderCard();

    expect(screen.getByText(/Развертывание копии во временной базе/)).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Создать копию' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByRole('button', { name: 'Восстановить' }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('explains a failed restore', () => {
    operationStatus = {
      maintenance: false,
      operation: {
        kind: 'RESTORE',
        status: 'FAILED',
        backupId: readyBackup.id,
        fileName: readyBackup.fileName,
        step: 'Проверка копии',
        startedAt: '2026-10-11T10:00:00.000Z',
        finishedAt: '2026-10-11T10:01:00.000Z',
        errorMessage: 'В копии нет ни одного активного администратора',
      },
      previousDatabase: null,
    };
    renderCard();

    expect(screen.getByText(/В копии нет ни одного активного администратора/)).toBeTruthy();
    expect(screen.getByText(/Рабочая база не изменилась/)).toBeTruthy();
  });

  it('offers to undo the last restore with confirmation', () => {
    operationStatus = {
      maintenance: false,
      operation: null,
      previousDatabase: {
        name: 'app_before_20261011t100000',
        restoredAt: '2026-10-11T10:00:00.000Z',
        backupId: readyBackup.id,
      },
    };
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Отменить восстановление' }));
    expect(undoRestore).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Вернуть прежнюю базу' }));

    expect(undoRestore).toHaveBeenCalledTimes(1);
  });
});

describe('disk space', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows free space and warns when it runs low', () => {
    operationStatus = { maintenance: false, operation: null, previousDatabase: null };
    overview = makeOverview({
      storage: {
        freeBytes: 30 * 1024 ** 2,
        usedBytes: 200 * 1024 ** 2,
        databaseBytes: 50 * 1024 ** 2,
        lowSpace: true,
      },
    });
    renderCard();

    expect(
      screen.getByText('На диске: свободно 30 МБ · копии занимают 200 МБ · база 50 МБ'),
    ).toBeTruthy();
    expect(screen.getByText(/Место на диске заканчивается/)).toBeTruthy();
  });
});

describe('import', () => {
  beforeEach(() => {
    operationStatus = { maintenance: false, operation: null, previousDatabase: null };
    overview = makeOverview({
      nextScheduledAt: null,
      isBusy: false,
      backups: [
        {
          ...readyBackup,
          trigger: 'IMPORTED',
          originalFileName: 'prod-2026-10-01.dump',
        },
      ],
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('uploads the chosen file with its original name', () => {
    renderCard();
    const file = new File(['PGDMP'], 'prod.dump', { type: 'application/octet-stream' });

    fireEvent.change(screen.getByLabelText('Файл резервной копии'), { target: { files: [file] } });

    expect(importBackup).toHaveBeenCalledWith({ data: file, params: { fileName: 'prod.dump' } });
    expect(typeof importOptions.request.onUploadProgress).toBe('function');
  });

  it('marks imported backups with their source file', () => {
    renderCard();

    expect(screen.getByText('Загружена из файла prod-2026-10-01.dump')).toBeTruthy();
    expect(screen.getByText(/Загружена · Администратор/)).toBeTruthy();
  });
});
