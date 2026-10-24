import { BadRequestException, ConflictException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { AuditService } from '../audit/audit.service';
import { getSessionEpochMs } from '../auth/session-epoch';
import type { PrismaService } from '../prisma.service';
import { BackupRestoreService } from './backup-restore.service';
import { BackupStorage } from './backup-storage';
import type { BackupsService } from './backups.service';
import type { DatabaseAdmin } from './database-admin';
import { MaintenanceState } from './maintenance-state';
import type { BackupMetadata } from './backups.types';

const ADMIN_ID = 1;
const BACKUP_ID = 'backup-20261011T100000Z-abcdef';

const readyBackup: BackupMetadata = {
  id: BACKUP_ID,
  fileName: `${BACKUP_ID}.dump`,
  status: 'READY',
  trigger: 'MANUAL',
  createdAt: '2026-10-11T10:00:00.000Z',
  completedAt: '2026-10-11T10:00:01.000Z',
  createdByUserId: ADMIN_ID,
  sizeBytes: 10,
  sha256: null,
  serverVersion: '16.4',
  lastMigration: null,
  errorMessage: null,
  originalFileName: null,
};

describe('BackupRestoreService', () => {
  let directory: string;
  let storage: BackupStorage;
  let maintenance: MaintenanceState;
  let backups: {
    findBackup: jest.Mock;
    getDatabaseSizeBytes: jest.Mock;
    startBackup: jest.Mock;
    waitForBackup: jest.Mock;
    isBusy: boolean;
  };
  let databases: {
    databaseName: string;
    connectionEnv: Record<string, string>;
    databaseUrlFor: jest.Mock;
    createDatabase: jest.Mock;
    dropDatabase: jest.Mock;
    listDatabases: jest.Mock;
    swapDatabases: jest.Mock;
    query: jest.Mock;
  };
  let runner: { run: jest.Mock };
  let audit: { record: jest.Mock };
  let prisma: { user: { findUnique: jest.Mock } };
  let adminCount: number;
  let restoredMigration: string | null;
  let service: BackupRestoreService;
  let maintenanceDuringPgRestore: boolean;

  const waitForOperation = async () => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const { operation } = await service.getStatus(ADMIN_ID);

      if (operation && operation.status !== 'RUNNING') {
        return operation;
      }

      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    throw new Error('Operation did not finish');
  };

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'restore-spec-'));
    storage = new BackupStorage({
      get: (key: string) => (key === 'BACKUP_DIR' ? directory : undefined),
    } as unknown as ConfigService);
    await writeFile(storage.dumpPath(BACKUP_ID), 'PGDMP');
    maintenance = new MaintenanceState();
    adminCount = 1;
    restoredMigration = '20261011000000_add_database_backup_audit_entity';
    maintenanceDuringPgRestore = false;

    backups = {
      findBackup: jest.fn().mockResolvedValue(readyBackup),
      getDatabaseSizeBytes: jest.fn().mockResolvedValue(1024),
      startBackup: jest.fn().mockResolvedValue({ ...readyBackup, id: 'pre', status: 'RUNNING' }),
      waitForBackup: jest
        .fn()
        .mockResolvedValue({ ...readyBackup, id: 'pre', trigger: 'PRE_RESTORE' }),
      isBusy: false,
    };
    databases = {
      databaseName: 'app',
      connectionEnv: { PGHOST: 'postgres', PGDATABASE: 'app' },
      databaseUrlFor: jest.fn((name: string) => `postgresql://u:p@postgres:5432/${name}`),
      createDatabase: jest.fn().mockResolvedValue(undefined),
      dropDatabase: jest.fn().mockResolvedValue(undefined),
      listDatabases: jest.fn().mockResolvedValue(['app_before_20261001t000000']),
      swapDatabases: jest.fn().mockResolvedValue(undefined),
      query: jest.fn((_database: string, sql: string) => {
        if (sql.includes('_prisma_migrations')) {
          return Promise.resolve(restoredMigration ? [{ migration_name: restoredMigration }] : []);
        }

        if (sql.includes('count(*)')) {
          return Promise.resolve([{ count: adminCount }]);
        }

        return Promise.resolve([]);
      }),
    };
    runner = {
      run: jest.fn((command: string) => {
        if (command === 'pg_restore') {
          maintenanceDuringPgRestore = maintenance.isActive;
        }

        return Promise.resolve('');
      }),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: ADMIN_ID, role: 'ADMIN', deactivatedAt: null }),
      },
    };

    service = new BackupRestoreService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
      storage,
      backups as unknown as BackupsService,
      databases as unknown as DatabaseAdmin,
      runner,
      maintenance,
    );
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('asks for the confirmation word', async () => {
    await expect(service.startRestore(ADMIN_ID, BACKUP_ID, 'restore')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(backups.startBackup).not.toHaveBeenCalled();
  });

  it('restores into a temporary database and swaps it in, keeping the previous one', async () => {
    const before = Date.now();
    await service.startRestore(ADMIN_ID, BACKUP_ID, 'RESTORE');
    const operation = await waitForOperation();

    expect(operation).toMatchObject({ kind: 'RESTORE', status: 'SUCCEEDED', backupId: BACKUP_ID });
    expect(backups.startBackup).toHaveBeenCalledWith('PRE_RESTORE', ADMIN_ID);
    expect(maintenanceDuringPgRestore).toBe(true);
    expect(maintenance.isActive).toBe(false);
    expect(runner.run).toHaveBeenCalledWith(
      'pg_restore',
      expect.arrayContaining(['--no-owner', '--no-acl', '--dbname=app_restore']),
      expect.anything(),
    );
    expect(databases.query).toHaveBeenCalledWith(
      'app_restore',
      'UPDATE users SET "hashedRefreshToken" = NULL',
    );
    expect(databases.dropDatabase).toHaveBeenCalledWith('app_before_20261001t000000');
    expect(databases.swapDatabases).toHaveBeenCalledWith(
      'app',
      'app_restore',
      expect.stringMatching(/^app_before_\d{8}t\d{6}$/),
    );

    const state = await storage.readState();

    expect(state.previousDatabase).toMatchObject({ backupId: BACKUP_ID });
    expect(state.sessionEpochMs).toBeGreaterThanOrEqual(before);
    expect(getSessionEpochMs()).toBe(state.sessionEpochMs);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'BACKUP_RESTORED', actorUserId: ADMIN_ID }),
    );
  });

  it('refuses a copy without an active admin and leaves the working database alone', async () => {
    adminCount = 0;

    await service.startRestore(ADMIN_ID, BACKUP_ID, 'RESTORE');
    const operation = await waitForOperation();

    expect(operation.status).toBe('FAILED');
    expect(operation.errorMessage).toContain('нет ни одного активного администратора');
    expect(databases.swapDatabases).not.toHaveBeenCalled();
    expect(databases.dropDatabase).toHaveBeenLastCalledWith('app_restore');
    expect(maintenance.isActive).toBe(false);
    expect((await storage.readState()).previousDatabase).toBeNull();
  });

  it('refuses a copy made by a newer version of the app', async () => {
    restoredMigration = '29991231000000_future';

    await service.startRestore(ADMIN_ID, BACKUP_ID, 'RESTORE');
    const operation = await waitForOperation();

    expect(operation.errorMessage).toContain('более новой версией приложения');
    expect(databases.swapDatabases).not.toHaveBeenCalled();
  });

  it('brings an older copy up to date with migrations before the swap', async () => {
    restoredMigration = '20260101000000_old';

    await service.startRestore(ADMIN_ID, BACKUP_ID, 'RESTORE');
    await waitForOperation();

    expect(runner.run).toHaveBeenCalledWith('npx', ['prisma', 'migrate', 'deploy'], {
      env: { DATABASE_URL: 'postgresql://u:p@postgres:5432/app_restore' },
      timeoutMs: expect.any(Number) as number,
    });
  });

  it('stops when the safety copy of the current database fails', async () => {
    backups.waitForBackup.mockResolvedValue({
      ...readyBackup,
      status: 'FAILED',
      errorMessage: 'disk full',
    });

    await service.startRestore(ADMIN_ID, BACKUP_ID, 'RESTORE');
    const operation = await waitForOperation();

    expect(operation.errorMessage).toContain('disk full');
    expect(runner.run).not.toHaveBeenCalled();
    expect(databases.createDatabase).not.toHaveBeenCalled();
  });

  it('refuses to start while a backup is running', async () => {
    backups.isBusy = true;

    await expect(service.startRestore(ADMIN_ID, BACKUP_ID, 'RESTORE')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('starts only one restore on a double click', async () => {
    const results = await Promise.allSettled([
      service.startRestore(ADMIN_ID, BACKUP_ID, 'RESTORE'),
      service.startRestore(ADMIN_ID, BACKUP_ID, 'RESTORE'),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({
      reason: expect.any(ConflictException) as ConflictException,
    });
    expect((await waitForOperation()).status).toBe('SUCCEEDED');
    expect(backups.startBackup).toHaveBeenCalledTimes(1);
  });

  it('undoes the last restore by swapping the previous database back', async () => {
    await storage.writeState({
      sessionEpochMs: 1,
      previousDatabase: {
        name: 'app_before_20261011t100000',
        restoredAt: '2026-10-11T10:00:00.000Z',
        backupId: BACKUP_ID,
      },
    });

    await service.startUndo(ADMIN_ID);
    const operation = await waitForOperation();

    expect(operation).toMatchObject({ kind: 'UNDO', status: 'SUCCEEDED' });
    expect(databases.swapDatabases).toHaveBeenCalledWith(
      'app',
      'app_before_20261011t100000',
      expect.stringMatching(/^app_undone_/),
    );
    expect((await storage.readState()).previousDatabase).toBeNull();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'BACKUP_RESTORE_UNDONE' }),
    );
  });

  it('brings the previous database up to date before undoing a restore', async () => {
    restoredMigration = '20260101000000_old';
    await storage.writeState({
      sessionEpochMs: 1,
      previousDatabase: {
        name: 'app_before_20261011t100000',
        restoredAt: '2026-10-11T10:00:00.000Z',
        backupId: BACKUP_ID,
      },
    });

    await service.startUndo(ADMIN_ID);
    const operation = await waitForOperation();

    expect(operation.status).toBe('SUCCEEDED');
    expect(databases.databaseUrlFor).toHaveBeenCalledWith('app_before_20261011t100000');
    expect(runner.run).toHaveBeenCalledWith('npx', ['prisma', 'migrate', 'deploy'], {
      env: expect.any(Object) as Record<string, string>,
      timeoutMs: expect.any(Number) as number,
    });
  });

  it('does not undo into a database made by a newer version of the app', async () => {
    restoredMigration = '29991231000000_future';
    await storage.writeState({
      sessionEpochMs: 1,
      previousDatabase: {
        name: 'app_before_20261011t100000',
        restoredAt: '2026-10-11T10:00:00.000Z',
        backupId: BACKUP_ID,
      },
    });

    await service.startUndo(ADMIN_ID);
    const operation = await waitForOperation();

    expect(operation.status).toBe('FAILED');
    expect(databases.swapDatabases).not.toHaveBeenCalled();
  });

  it('has nothing to undo without a saved previous database', async () => {
    await expect(service.startUndo(ADMIN_ID)).rejects.toBeInstanceOf(ConflictException);
  });

  it('reports only the maintenance flag while the database is being swapped', async () => {
    maintenance.activate('restore');

    await expect(service.getStatus(ADMIN_ID)).resolves.toMatchObject({ maintenance: true });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('refuses to start when the disk cannot hold a second database', async () => {
    jest.spyOn(storage, 'freeBytes').mockResolvedValue(10 * 1024 * 1024);
    backups.getDatabaseSizeBytes.mockResolvedValue(50 * 1024 * 1024);

    await expect(service.startRestore(ADMIN_ID, BACKUP_ID, 'RESTORE')).rejects.toThrow(
      'Недостаточно места для восстановления',
    );
    expect(backups.startBackup).not.toHaveBeenCalled();
    expect((await service.getStatus(ADMIN_ID)).operation?.status).not.toBe('RUNNING');
  });
});
