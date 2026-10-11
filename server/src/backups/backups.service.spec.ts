import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Readable } from 'node:stream';

import type { AuditService } from '../audit/audit.service';
import type { PrismaService } from '../prisma.service';
import { BackupScheduler } from './backup-scheduler';
import { BackupSettingsService } from './backup-settings.service';
import { BackupStorage } from './backup-storage';
import { BackupsService } from './backups.service';
import { MaintenanceState } from './maintenance-state';
import { PgToolMissingError, type PgToolRunOptions } from './pg-tools.runner';
import type { BackupMetadata } from './backups.types';

type RunArgs = [command: string, args: string[], options: PgToolRunOptions];

const ADMIN_ID = 1;
const DUMP_CONTENT = 'PGDMP fake dump';

const readStream = async (stream: Readable) => {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk as Buffer));
  }

  return Buffer.concat(chunks).toString();
};

describe('BackupsService', () => {
  let directory: string;
  let env: Record<string, string>;
  let storage: BackupStorage;
  let runner: { run: jest.Mock<Promise<string>, RunArgs> };
  let audit: { record: jest.Mock };
  let prisma: {
    user: { findUnique: jest.Mock; findMany: jest.Mock };
    $queryRaw: jest.Mock;
  };
  let service: BackupsService;
  let settingsService: BackupSettingsService;
  let scheduler: BackupScheduler;
  let maintenance: MaintenanceState;

  const createService = () => {
    const config = { get: (key: string) => env[key] } as unknown as ConfigService;
    storage = new BackupStorage(config);
    maintenance = new MaintenanceState();
    settingsService = new BackupSettingsService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
      storage,
      config,
    );
    service = new BackupsService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
      config,
      storage,
      runner,
      settingsService,
      maintenance,
    );
    scheduler = new BackupScheduler(service, settingsService, storage);
  };

  const waitForIdle = async () => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (!(await service.getOverview(ADMIN_ID)).isBusy) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    throw new Error('Backup did not finish');
  };

  const seedBackup = async (overrides: Partial<BackupMetadata> & { id: string }) => {
    const backup: BackupMetadata = {
      fileName: `${overrides.id}.dump`,
      status: 'READY',
      trigger: 'MANUAL',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      createdByUserId: null,
      sizeBytes: DUMP_CONTENT.length,
      sha256: null,
      serverVersion: '16.4',
      lastMigration: null,
      errorMessage: null,
      originalFileName: null,
      ...overrides,
    };

    await storage.write(backup);
    await writeFile(storage.dumpPath(backup.id), DUMP_CONTENT);

    return backup;
  };

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'backups-spec-'));
    env = {
      BACKUP_DIR: directory,
      DATABASE_URL: 'postgresql://user:secret@postgres:5432/my_app_db?schema=public',
    };
    runner = {
      run: jest.fn<Promise<string>, RunArgs>(async (_command, args) => {
        if (args[0] === '--version') {
          return 'pg_dump (PostgreSQL) 16.4 (Debian 16.4-1.pgdg120+1)\n';
        }

        const fileArg = args.find((arg) => arg.startsWith('--file='));
        await writeFile(fileArg!.slice('--file='.length), DUMP_CONTENT);

        return '';
      }),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: ADMIN_ID, role: 'ADMIN', deactivatedAt: null }),
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: ADMIN_ID, email: 'admin@example.com', name: 'Admin' }]),
      },
      $queryRaw: jest.fn((strings: TemplateStringsArray) => {
        const sql = strings.join('');

        if (sql.includes('server_version_num')) {
          return Promise.resolve([{ num: '160004', text: '16.4' }]);
        }

        if (sql.includes('pg_database_size')) {
          return Promise.resolve([{ size: 1024n }]);
        }

        if (sql.includes('_prisma_migrations')) {
          return Promise.resolve([
            { migration_name: '20261011000000_add_database_backup_audit_entity' },
          ]);
        }

        return Promise.resolve([]);
      }),
    };
    createService();
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('creates a backup in the background and records it in the audit log', async () => {
    const { backup } = await service.createBackup(ADMIN_ID);

    expect(backup).toMatchObject({ status: 'RUNNING', trigger: 'MANUAL' });
    await waitForIdle();

    const overview = await service.getOverview(ADMIN_ID);
    const [ready] = overview.backups;

    expect(ready).toMatchObject({
      id: backup.id,
      status: 'READY',
      sizeBytes: DUMP_CONTENT.length,
      createdBy: { id: ADMIN_ID, email: 'admin@example.com', name: 'Admin' },
    });
    expect(ready.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(await readFile(storage.dumpPath(backup.id), 'utf8')).toBe(DUMP_CONTENT);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'DATABASE_BACKUP',
        entityId: backup.id,
        action: 'BACKUP_CREATED',
        actorUserId: ADMIN_ID,
      }),
    );
  });

  it('passes the connection through PG* variables and never puts the password into arguments', async () => {
    await service.createBackup(ADMIN_ID);
    await waitForIdle();

    const dumpCall = runner.run.mock.calls.find(([, args]) => args[0] !== '--version');
    const [command, args, options] = dumpCall!;

    expect(command).toBe('pg_dump');
    expect(args).toEqual(expect.arrayContaining(['--format=custom', '--no-owner', '--no-acl']));
    expect(args.join(' ')).not.toContain('secret');
    expect(options.env).toMatchObject({
      PGHOST: 'postgres',
      PGDATABASE: 'my_app_db',
      PGPASSWORD: 'secret',
    });
  });

  it('marks the backup failed and removes the partial file when pg_dump fails', async () => {
    runner.run.mockImplementation(async (_command: string, args: string[]) => {
      if (args[0] === '--version') {
        return 'pg_dump (PostgreSQL) 16.4';
      }

      const fileArg = args.find((arg) => arg.startsWith('--file='));
      await writeFile(fileArg!.slice('--file='.length), 'half');
      throw new Error('connection refused');
    });

    const { backup } = await service.createBackup(ADMIN_ID);
    await waitForIdle();

    const [failed] = (await service.getOverview(ADMIN_ID)).backups;

    expect(failed).toMatchObject({ status: 'FAILED', errorMessage: 'connection refused' });
    expect(await readdir(directory)).toEqual([`${backup.id}.json`]);
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'BACKUP_FAILED' }));
  });

  it('allows only one backup at a time', async () => {
    let finishDump: () => void = () => undefined;
    let markDumpStarted: () => void = () => undefined;
    const dumpStarted = new Promise<void>((resolve) => {
      markDumpStarted = resolve;
    });
    runner.run.mockImplementation(async (_command: string, args: string[]) => {
      if (args[0] === '--version') {
        return 'pg_dump (PostgreSQL) 16.4';
      }

      const fileArg = args.find((arg) => arg.startsWith('--file='));
      await writeFile(fileArg!.slice('--file='.length), DUMP_CONTENT);
      await new Promise<void>((resolve) => {
        finishDump = resolve;
        markDumpStarted();
      });

      return '';
    });

    await service.createBackup(ADMIN_ID);
    await expect(service.createBackup(ADMIN_ID)).rejects.toBeInstanceOf(ConflictException);

    await dumpStarted;
    finishDump();
    await waitForIdle();
  });

  it('reports backups as unavailable when pg_dump is missing', async () => {
    runner.run.mockRejectedValue(new PgToolMissingError('pg_dump'));

    const overview = await service.getOverview(ADMIN_ID);

    expect(overview.availability).toMatchObject({
      available: false,
      reason: 'pg_dump не установлен в контейнере backend',
      serverVersion: '16.4',
    });
    await expect(service.createBackup(ADMIN_ID)).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses a pg_dump older than the server', async () => {
    runner.run.mockResolvedValue('pg_dump (PostgreSQL) 15.8');

    const { availability } = await service.getOverview(ADMIN_ID);

    expect(availability.available).toBe(false);
    expect(availability.reason).toContain('pg_dump 15 старее сервера PostgreSQL 16');
  });

  it('keeps backups within the retention limits but never deletes the latest ready one', async () => {
    env.BACKUP_RETENTION_DAYS = '14';
    env.BACKUP_MAX_COUNT = '2';
    createService();

    const day = 24 * 60 * 60 * 1000;
    await seedBackup({
      id: 'backup-20260901T000000Z-aaaaaa',
      createdAt: new Date(Date.now() - 30 * day).toISOString(),
    });
    await seedBackup({
      id: 'backup-20261010T000000Z-bbbbbb',
      createdAt: new Date(Date.now() - day).toISOString(),
    });
    await seedBackup({
      id: 'backup-20261009T000000Z-cccccc',
      createdAt: new Date(Date.now() - 2 * day).toISOString(),
    });

    const { backup } = await service.createBackup(ADMIN_ID);
    await waitForIdle();

    const ids = (await service.getOverview(ADMIN_ID)).backups.map((item) => item.id);

    expect(ids).toEqual([backup.id, 'backup-20261010T000000Z-bbbbbb']);
  });

  it('keeps an old backup when it is the only ready one', async () => {
    runner.run.mockImplementation((_command: string, args: string[]) =>
      args[0] === '--version'
        ? Promise.resolve('pg_dump (PostgreSQL) 16.4')
        : Promise.reject(new Error('disk error')),
    );
    await seedBackup({
      id: 'backup-20260101T000000Z-aaaaaa',
      createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
    });

    await service.createBackup(ADMIN_ID);
    await waitForIdle();

    expect((await service.getOverview(ADMIN_ID)).backups.map((item) => item.id)).toContain(
      'backup-20260101T000000Z-aaaaaa',
    );
  });

  it('marks a backup interrupted by a restart as failed', async () => {
    await seedBackup({ id: 'backup-20261011T100000Z-dddddd', status: 'RUNNING' });
    await writeFile(storage.partialDumpPath('backup-20261011T100000Z-dddddd'), 'half');

    await service.onApplicationBootstrap();

    const [backup] = (await service.getOverview(ADMIN_ID)).backups;

    expect(backup).toMatchObject({
      status: 'FAILED',
      errorMessage: 'Создание копии прервано перезапуском сервера',
    });
    expect(await readdir(directory)).not.toContain('backup-20261011T100000Z-dddddd.dump.partial');
  });

  it('streams a backup once through a one-time download link', async () => {
    const backup = await seedBackup({ id: 'backup-20261011T100000Z-eeeeee' });

    const link = await service.createDownloadLink(ADMIN_ID, backup.id);
    const token = link.path.split('/').pop()!;

    expect(link.path).toMatch(/^\/admin\/backups\/download\/[A-Za-z0-9_-]{43}$/);

    const file = await service.openDownload(token);

    expect(file.fileName).toBe(`${backup.id}.dump`);
    expect(await readStream(file.stream)).toBe(DUMP_CONTENT);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'BACKUP_DOWNLOADED', actorUserId: ADMIN_ID }),
    );
    await expect(service.openDownload(token)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a download link once its owner is no longer an admin', async () => {
    const backup = await seedBackup({ id: 'backup-20261011T100000Z-ffffff' });
    const token = (await service.createDownloadLink(ADMIN_ID, backup.id)).path.split('/').pop()!;

    prisma.user.findUnique.mockResolvedValue({ id: ADMIN_ID, role: 'USER', deactivatedAt: null });

    await expect(service.openDownload(token)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('deletes a backup and records it', async () => {
    const backup = await seedBackup({ id: 'backup-20261011T100000Z-abcdef' });

    await expect(service.deleteBackup(ADMIN_ID, backup.id)).resolves.toEqual({ id: backup.id });
    expect(await readdir(directory)).toEqual([]);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'BACKUP_DELETED', actorUserId: ADMIN_ID }),
    );
  });

  it.each(['../etc/passwd', 'backup-x', 'backup-20261011T100000Z-zzzzzz'])(
    'treats %p as an unknown backup',
    async (id) => {
      await expect(service.deleteBackup(ADMIN_ID, id)).rejects.toBeInstanceOf(NotFoundException);
    },
  );

  it('requires an admin for every operation', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2, role: 'USER', deactivatedAt: null });

    await expect(service.getOverview(2)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.createBackup(2)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.deleteBackup(2, 'backup-20261011T100000Z-abcdef')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(
      service.createDownloadLink(2, 'backup-20261011T100000Z-abcdef'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(runner.run).not.toHaveBeenCalled();
  });

  describe('settings', () => {
    it('falls back to env defaults until an admin saves settings', async () => {
      env.BACKUP_RETENTION_DAYS = '7';
      createService();

      expect((await service.getOverview(ADMIN_ID)).settings).toEqual({
        scheduleEnabled: true,
        scheduleHourUtc: 3,
        retentionDays: 7,
        maxCount: 30,
      });
    });

    it('saves settings to the volume and records the change', async () => {
      await settingsService.updateSettings(ADMIN_ID, {
        scheduleEnabled: false,
        scheduleHourUtc: 22,
        retentionDays: 14,
        maxCount: 30,
      });

      const overview = await service.getOverview(ADMIN_ID);

      expect(overview.settings).toMatchObject({ scheduleEnabled: false, scheduleHourUtc: 22 });
      expect(overview.nextScheduledAt).toBeNull();
      expect(JSON.parse(await readFile(join(directory, 'settings.json'), 'utf8'))).toMatchObject({
        scheduleHourUtc: 22,
      });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'BACKUP_SETTINGS_UPDATED',
          changes: [
            { field: 'scheduleEnabled', before: 'true', after: 'false' },
            { field: 'scheduleHourUtc', before: '3', after: '22' },
          ],
        }),
      );
    });

    it('rejects out-of-range values', async () => {
      await expect(
        settingsService.updateSettings(ADMIN_ID, {
          scheduleEnabled: true,
          scheduleHourUtc: 24,
          retentionDays: 0,
          maxCount: 30,
        }),
      ).rejects.toThrow('Некорректные настройки');
    });

    it('applies the saved retention when pruning', async () => {
      await settingsService.updateSettings(ADMIN_ID, {
        scheduleEnabled: true,
        scheduleHourUtc: 3,
        retentionDays: 14,
        maxCount: 1,
      });
      await seedBackup({
        id: 'backup-20261010T000000Z-bbbbbb',
        createdAt: new Date(Date.now() - 60_000).toISOString(),
      });

      const { backup } = await service.createBackup(ADMIN_ID);
      await waitForIdle();

      expect((await service.getOverview(ADMIN_ID)).backups.map((item) => item.id)).toEqual([
        backup.id,
      ]);
    });
  });

  describe('schedule', () => {
    const at = (iso: string) => new Date(iso);

    it('starts a scheduled backup once the hour has come', async () => {
      expect(await scheduler.runIfDue(at('2026-10-11T02:50:00Z'))).toBe(true);
      await waitForIdle();

      const [backup] = (await service.getOverview(ADMIN_ID)).backups;

      expect(backup).toMatchObject({ trigger: 'SCHEDULED', status: 'READY', createdBy: null });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'BACKUP_CREATED', actorUserId: null }),
      );
    });

    it('skips when a fresh successful backup already exists', async () => {
      await seedBackup({
        id: 'backup-20261011T100000Z-aaaaaa',
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      });

      expect(await scheduler.runIfDue()).toBe(false);
      expect(runner.run).not.toHaveBeenCalled();
    });

    it('does not retry a failed scheduled backup within the same slot', async () => {
      const now = new Date();
      await seedBackup({
        id: 'backup-20261011T030000Z-aaaaaa',
        status: 'FAILED',
        trigger: 'SCHEDULED',
        createdAt: now.toISOString(),
      });

      expect(await scheduler.runIfDue(now)).toBe(false);
    });

    it('does nothing when the schedule is off', async () => {
      await settingsService.updateSettings(ADMIN_ID, {
        scheduleEnabled: false,
        scheduleHourUtc: 3,
        retentionDays: 14,
        maxCount: 30,
      });

      expect(await scheduler.runIfDue()).toBe(false);
      expect(runner.run).not.toHaveBeenCalled();
    });

    it('skips quietly when pg_dump is unavailable', async () => {
      runner.run.mockRejectedValue(new PgToolMissingError('pg_dump'));

      expect(await scheduler.runIfDue()).toBe(false);
      expect(await readdir(directory)).toEqual([]);
    });
  });

  it('refuses to start a backup while a restore holds the maintenance lock', async () => {
    maintenance.activate('restore');

    await expect(service.createBackup(ADMIN_ID)).rejects.toBeInstanceOf(ConflictException);
    expect(await readdir(directory)).toEqual([]);
  });

  it('never prunes an imported backup automatically', async () => {
    env.BACKUP_MAX_COUNT = '1';
    createService();
    await seedBackup({
      id: 'backup-20260101T000000Z-aaaaaa',
      trigger: 'IMPORTED',
      createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
    });

    const { backup } = await service.createBackup(ADMIN_ID);
    await waitForIdle();

    expect((await service.getOverview(ADMIN_ID)).backups.map((item) => item.id)).toEqual([
      backup.id,
      'backup-20260101T000000Z-aaaaaa',
    ]);
  });
});
