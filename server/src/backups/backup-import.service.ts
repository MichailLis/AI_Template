import {
  BadRequestException,
  ConflictException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream } from 'node:fs';
import { open } from 'node:fs/promises';
import { Transform, type Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma.service';
import { BackupStorage } from './backup-storage';
import { BackupsService, createBackupId } from './backups.service';
import { DatabaseAdmin } from './database-admin';
import { MaintenanceState } from './maintenance-state';
import { PgToolsRunner } from './pg-tools.runner';
import type { BackupMetadata } from './backups.types';

const DEFAULT_MAX_UPLOAD_MB = 500;
const LIST_TIMEOUT_MS = 2 * 60 * 1000;
/** Заголовок файла pg_dump в формате custom (`-Fc`). */
const CUSTOM_DUMP_SIGNATURE = 'PGDMP';
const ORIGINAL_NAME_LIMIT = 200;

class UploadTooLargeError extends Error {}

/**
 * Загрузка готового дампа, снятого на другом сервере или скачанного раньше. Файл становится
 * обычной копией в списке; восстановление из нее идет тем же путем, что и из своей копии, со
 * всеми проверками во временной базе. Здесь проверяется только, что это читаемый дамп.
 */
@Injectable()
export class BackupImportService {
  private readonly maxBytes: number;
  private isImporting = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: BackupStorage,
    private readonly backups: BackupsService,
    private readonly databases: DatabaseAdmin,
    private readonly runner: PgToolsRunner,
    private readonly maintenance: MaintenanceState,
    config: ConfigService,
  ) {
    const megabytes = Number(config.get<string>('BACKUP_MAX_UPLOAD_MB'));
    this.maxBytes =
      (Number.isInteger(megabytes) && megabytes > 0 ? megabytes : DEFAULT_MAX_UPLOAD_MB) *
      1024 *
      1024;
  }

  get maxUploadBytes() {
    return this.maxBytes;
  }

  async importBackup(
    userId: number,
    body: Readable,
    declaredLength: number | undefined,
    originalName: string | undefined,
  ) {
    if (this.maintenance.isActive || this.isImporting) {
      throw new ConflictException('Дождитесь окончания текущей операции', 'OPERATION_IN_PROGRESS');
    }

    if (declaredLength !== undefined && declaredLength > this.maxBytes) {
      throw this.tooLarge();
    }

    this.isImporting = true;
    const now = new Date();
    const id = createBackupId(now);

    try {
      await this.storage.ensureWritable();
      await this.receive(body, this.storage.partialDumpPath(id));
      await this.assertReadableDump(this.storage.partialDumpPath(id));

      const file = await this.storage.publishPartialDump(id);
      const backup: BackupMetadata = {
        id,
        fileName: `${id}.dump`,
        status: 'READY',
        trigger: 'IMPORTED',
        createdAt: now.toISOString(),
        completedAt: new Date().toISOString(),
        createdByUserId: userId,
        ...file,
        serverVersion: null,
        lastMigration: null,
        errorMessage: null,
        originalFileName: originalName?.trim().slice(0, ORIGINAL_NAME_LIMIT) || null,
      };

      await this.storage.write(backup);
      await this.audit.record({
        entityType: 'DATABASE_BACKUP',
        entityId: id,
        action: 'BACKUP_IMPORTED',
        actorUserId: userId,
        changes: [
          { field: 'fileName', before: null, after: backup.fileName },
          ...(backup.originalFileName
            ? [{ field: 'originalFileName', before: null, after: backup.originalFileName }]
            : []),
        ],
      });

      const [item] = await this.backups.toResponseItems([backup]);

      return { backup: item };
    } catch (error) {
      await this.storage.removePartialDump(id).catch(() => undefined);
      body.resume();

      if (error instanceof UploadTooLargeError) {
        throw this.tooLarge();
      }

      throw error;
    } finally {
      this.isImporting = false;
    }
  }

  /** Тело запроса пишется на диск потоком: дамп в сотни мегабайт не держится в памяти. */
  private async receive(body: Readable, path: string) {
    let received = 0;
    const limit = new Transform({
      transform: (chunk: Buffer, _encoding, callback) => {
        received += chunk.length;
        callback(received > this.maxBytes ? new UploadTooLargeError() : null, chunk);
      },
    });

    await pipeline(body, limit, createWriteStream(path));

    if (received === 0) {
      throw new BadRequestException('Файл пустой');
    }
  }

  private async assertReadableDump(path: string) {
    const handle = await open(path, 'r');
    const header = Buffer.alloc(CUSTOM_DUMP_SIGNATURE.length);

    try {
      await handle.read(header, 0, header.length, 0);
    } finally {
      await handle.close();
    }

    if (header.toString('latin1') !== CUSTOM_DUMP_SIGNATURE) {
      throw new BadRequestException(
        'Это не резервная копия PostgreSQL: нужен файл .dump, созданный pg_dump в формате custom',
      );
    }

    try {
      await this.runner.run('pg_restore', ['--list', path], {
        env: this.databases.connectionEnv,
        timeoutMs: LIST_TIMEOUT_MS,
      });
    } catch {
      throw new BadRequestException('Файл поврежден: pg_restore не может прочитать его оглавление');
    }
  }

  private tooLarge() {
    return new PayloadTooLargeException(
      `Файл больше ${Math.round(this.maxBytes / 1024 / 1024)} МБ (BACKUP_MAX_UPLOAD_MB)`,
    );
  }
}
