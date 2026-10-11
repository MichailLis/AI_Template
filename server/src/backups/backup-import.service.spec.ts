import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';

import type { AuditService } from '../audit/audit.service';
import type { PrismaService } from '../prisma.service';
import { BackupImportService } from './backup-import.service';
import { BackupStorage } from './backup-storage';
import type { BackupsService } from './backups.service';
import type { DatabaseAdmin } from './database-admin';
import { MaintenanceState } from './maintenance-state';
import type { BackupMetadata } from './backups.types';

const ADMIN_ID = 1;

describe('BackupImportService', () => {
  let directory: string;
  let storage: BackupStorage;
  let maintenance: MaintenanceState;
  let runner: { run: jest.Mock };
  let audit: { record: jest.Mock };
  let service: BackupImportService;

  const createService = (maxUploadMb?: string) => {
    const env: Record<string, string | undefined> = {
      BACKUP_DIR: directory,
      BACKUP_MAX_UPLOAD_MB: maxUploadMb,
    };
    const config = { get: (key: string) => env[key] } as unknown as ConfigService;
    storage = new BackupStorage(config);
    service = new BackupImportService(
      {
        user: {
          findUnique: jest.fn().mockResolvedValue({ id: 1, role: 'ADMIN', deactivatedAt: null }),
        },
      } as unknown as PrismaService,
      audit as unknown as AuditService,
      storage,
      {
        toResponseItems: (backups: BackupMetadata[]) => Promise.resolve(backups),
      } as unknown as BackupsService,
      { connectionEnv: { PGHOST: 'postgres' } } as unknown as DatabaseAdmin,
      runner,
      maintenance,
      config,
    );
  };

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'import-spec-'));
    maintenance = new MaintenanceState();
    runner = { run: jest.fn().mockResolvedValue('; Archive created at ...') };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    createService();
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('stores a readable dump as an imported backup', async () => {
    const { backup } = await service.importBackup(
      ADMIN_ID,
      Readable.from([Buffer.from('PGDMP'), Buffer.from(' rest of the dump')]),
      22,
      'prod-2026-10-01.dump',
    );

    expect(backup).toMatchObject({
      trigger: 'IMPORTED',
      status: 'READY',
      sizeBytes: 22,
      originalFileName: 'prod-2026-10-01.dump',
    });
    expect(await readFile(storage.dumpPath(backup.id), 'utf8')).toBe('PGDMP rest of the dump');
    expect(runner.run).toHaveBeenCalledWith(
      'pg_restore',
      ['--list', storage.partialDumpPath(backup.id)],
      expect.anything(),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'BACKUP_IMPORTED', actorUserId: ADMIN_ID }),
    );
  });

  it('rejects a file that is not a custom-format dump', async () => {
    await expect(
      service.importBackup(
        ADMIN_ID,
        Readable.from([Buffer.from('CREATE TABLE x();')]),
        17,
        'x.sql',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(runner.run).not.toHaveBeenCalled();
    expect(await readdir(directory)).toEqual([]);
  });

  it('rejects a dump pg_restore cannot read', async () => {
    runner.run.mockRejectedValue(new Error('pg_restore: error: could not read input file'));

    await expect(
      service.importBackup(ADMIN_ID, Readable.from([Buffer.from('PGDMP broken')]), 12, 'a.dump'),
    ).rejects.toThrow('Файл поврежден');
    expect(await readdir(directory)).toEqual([]);
  });

  it('rejects an oversized upload by its declared length before reading it', async () => {
    createService('1');

    await expect(
      service.importBackup(ADMIN_ID, Readable.from([]), 2 * 1024 * 1024, 'big.dump'),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
  });

  it('stops reading once the stream goes over the limit', async () => {
    createService('1');
    const chunk = Buffer.alloc(512 * 1024, 1);
    chunk.write('PGDMP');

    await expect(
      service.importBackup(ADMIN_ID, Readable.from([chunk, chunk, chunk]), undefined, 'big.dump'),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
    expect(await readdir(directory)).toEqual([]);
  });

  it('rejects an empty upload', async () => {
    await expect(
      service.importBackup(ADMIN_ID, Readable.from([]), 0, 'empty.dump'),
    ).rejects.toThrow('Файл пустой');
  });

  it('waits for a running restore to finish', async () => {
    maintenance.activate('restore');

    await expect(
      service.importBackup(ADMIN_ID, Readable.from([Buffer.from('PGDMP')]), 5, 'a.dump'),
    ).rejects.toThrow('Дождитесь окончания');
  });
});
