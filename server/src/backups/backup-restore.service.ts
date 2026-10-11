import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { AuditService } from '../audit/audit.service';
import type { AuditAction } from '../audit/audit.types';
import { setSessionEpochMs } from '../auth/session-epoch';
import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { PrismaService } from '../prisma.service';
import { BackupStorage } from './backup-storage';
import { BackupsService } from './backups.service';
import { DatabaseAdmin } from './database-admin';
import { MaintenanceState } from './maintenance-state';
import { PgToolsRunner } from './pg-tools.runner';
import type { BackupMetadata } from './backups.types';

export const RESTORE_CONFIRMATION = 'RESTORE';

const RESTORE_TIMEOUT_MS = 30 * 60 * 1000;
const MIGRATE_TIMEOUT_MS = 5 * 60 * 1000;
const ERROR_MESSAGE_LIMIT = 500;
const MAINTENANCE_MESSAGE = 'Идет восстановление базы данных, попробуйте через минуту';

export type RestoreOperationKind = 'RESTORE' | 'UNDO';
export type RestoreOperationStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export interface RestoreOperation {
  kind: RestoreOperationKind;
  status: RestoreOperationStatus;
  backupId: string | null;
  fileName: string | null;
  step: string;
  startedAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
}

const compactTimestamp = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, '')
    .toLowerCase();

const toErrorMessage = (error: unknown) =>
  (error instanceof Error ? error.message : String(error)).slice(0, ERROR_MESSAGE_LIMIT);

/**
 * Восстановление базы из копии на сервере. Рабочая база не трогается, пока копия не развернута и
 * не проверена во временной базе; затем базы меняются местами переименованием, а прежняя остается
 * рядом, чтобы восстановление можно было отменить. Подробности и риски — в
 * docs/plans/2026-10-08-admin-db-backup-plan.md, раздел «Как устроено восстановление».
 */
@Injectable()
export class BackupRestoreService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BackupRestoreService.name);
  private operation: RestoreOperation | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: BackupStorage,
    private readonly backups: BackupsService,
    private readonly databases: DatabaseAdmin,
    private readonly runner: PgToolsRunner,
    private readonly maintenance: MaintenanceState,
  ) {}

  private get temporaryDatabase() {
    return `${this.databases.databaseName}_restore`;
  }

  private get previousDatabasePrefix() {
    return `${this.databases.databaseName}_before_`;
  }

  /** Граница старых сессий переживает перезапуск; временная база от прерванного восстановления удаляется. */
  async onApplicationBootstrap() {
    try {
      setSessionEpochMs((await this.storage.readState()).sessionEpochMs);

      if (await this.storage.exists()) {
        await this.databases.dropDatabase(this.temporaryDatabase);
      }
    } catch (error) {
      this.logger.warn(`Restore state recovery skipped: ${toErrorMessage(error)}`);
    }
  }

  async getStatus(userId: number) {
    // Во время подмены рабочей базы проверить права негде: отдается только факт работ.
    if (this.maintenance.isActive) {
      return { maintenance: true, operation: this.operation, previousDatabase: null };
    }

    await ensureAdminAccess(this.prisma, userId);

    return {
      maintenance: false,
      operation: this.operation,
      previousDatabase: (await this.storage.readState()).previousDatabase,
    };
  }

  async startRestore(userId: number, backupId: string, confirmation: string) {
    await ensureAdminAccess(this.prisma, userId);

    if (confirmation !== RESTORE_CONFIRMATION) {
      throw new BadRequestException(`Для подтверждения введите ${RESTORE_CONFIRMATION}`);
    }

    const backup = await this.backups.findBackup(backupId);

    if (backup.status !== 'READY' || !(await this.storage.dumpExists(backup.id))) {
      throw new ConflictException('Файл копии недоступен', 'BACKUP_NOT_READY');
    }

    this.assertIdle();
    this.operation = this.createOperation('RESTORE', backup);
    void this.runExclusive(() => this.restore(userId, backup));

    return { operation: this.operation };
  }

  async startUndo(userId: number) {
    await ensureAdminAccess(this.prisma, userId);

    const { previousDatabase } = await this.storage.readState();

    if (!previousDatabase) {
      throw new ConflictException('Нет базы, сохраненной до восстановления', 'NOTHING_TO_UNDO');
    }

    this.assertIdle();
    this.operation = this.createOperation('UNDO', null);
    void this.runExclusive(() => this.undo(userId, previousDatabase.name));

    return { operation: this.operation };
  }

  private assertIdle() {
    if (this.operation?.status === 'RUNNING' || this.backups.isBusy) {
      throw new ConflictException('Дождитесь окончания текущей операции', 'OPERATION_IN_PROGRESS');
    }
  }

  private createOperation(
    kind: RestoreOperationKind,
    backup: BackupMetadata | null,
  ): RestoreOperation {
    return {
      kind,
      status: 'RUNNING',
      backupId: backup?.id ?? null,
      fileName: backup?.fileName ?? null,
      step: 'Подготовка',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      errorMessage: null,
    };
  }

  private setStep(step: string) {
    if (this.operation) {
      this.operation = { ...this.operation, step };
    }
  }

  private async runExclusive(run: () => Promise<void>) {
    try {
      await run();
      this.finish('SUCCEEDED', null);
    } catch (error) {
      const message = toErrorMessage(error);
      this.logger.error(`${this.operation?.kind ?? 'Restore'} failed: ${message}`);
      this.finish('FAILED', message);
    } finally {
      this.maintenance.deactivate();
    }
  }

  private finish(status: RestoreOperationStatus, errorMessage: string | null) {
    if (this.operation) {
      this.operation = {
        ...this.operation,
        status,
        errorMessage,
        finishedAt: new Date().toISOString(),
      };
    }
  }

  private async restore(userId: number, backup: BackupMetadata) {
    this.setStep('Копия текущей базы');
    const safetyCopy = await this.backups.waitForBackup(
      (await this.backups.startBackup('PRE_RESTORE', userId)).id,
    );

    if (safetyCopy?.status !== 'READY') {
      throw new Error(
        `Не удалось сохранить текущую базу перед восстановлением: ${safetyCopy?.errorMessage ?? 'неизвестная ошибка'}`,
      );
    }

    this.maintenance.activate(MAINTENANCE_MESSAGE);
    const temporary = this.temporaryDatabase;

    try {
      this.setStep('Развертывание копии во временной базе');
      await this.databases.dropDatabase(temporary);
      await this.databases.createDatabase(temporary);
      await this.runner.run(
        'pg_restore',
        [
          '--no-owner',
          '--no-acl',
          '--exit-on-error',
          '--single-transaction',
          `--dbname=${temporary}`,
          this.storage.dumpPath(backup.id),
        ],
        { env: this.databases.connectionEnv, timeoutMs: RESTORE_TIMEOUT_MS },
      );

      this.setStep('Проверка копии');
      await this.prepareRestoredDatabase(temporary);

      this.setStep('Подмена базы');
      const previousName = `${this.previousDatabasePrefix}${compactTimestamp(new Date())}`;
      await this.dropPreviousDatabases();
      await this.databases.swapDatabases(this.databases.databaseName, temporary, previousName);

      await this.commitSessions({
        name: previousName,
        restoredAt: new Date().toISOString(),
        backupId: backup.id,
      });
      await this.recordAudit('BACKUP_RESTORED', backup.id, userId, [
        { field: 'fileName', before: null, after: backup.fileName },
      ]);
    } catch (error) {
      await this.databases.dropDatabase(temporary).catch(() => undefined);
      throw error;
    }
  }

  private async undo(userId: number, previousName: string) {
    this.maintenance.activate(MAINTENANCE_MESSAGE);
    this.setStep('Возврат базы до восстановления');

    const restoredName = `${this.databases.databaseName}_undone_${compactTimestamp(new Date())}`;
    await this.databases.swapDatabases(this.databases.databaseName, previousName, restoredName);
    await this.databases.dropDatabase(restoredName);
    await this.commitSessions(null);
    await this.recordAudit('BACKUP_RESTORE_UNDONE', previousName, userId, []);
  }

  /**
   * Проверки и доводка во временной базе, пока рабочая не тронута: схема не новее приложения,
   * более старая догоняется миграциями, есть кому войти, старые сессии сброшены.
   */
  private async prepareRestoredDatabase(database: string) {
    const restoredMigration = await this.readLastMigration(database);
    const appMigration = await this.readAppLastMigration();

    if (restoredMigration === null) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'В копии нет истории миграций Prisma: восстановите ее вручную по инструкции',
        );
      }
    } else if (appMigration !== null && restoredMigration > appMigration) {
      throw new Error('Копия снята более новой версией приложения: сначала обновите приложение');
    } else if (appMigration !== null && restoredMigration < appMigration) {
      this.setStep('Обновление схемы копии');
      await this.runner.run('npx', ['prisma', 'migrate', 'deploy'], {
        env: { DATABASE_URL: this.databases.databaseUrlFor(database) },
        timeoutMs: MIGRATE_TIMEOUT_MS,
      });
    }

    const [{ count }] = await this.databases.query<{ count: number }>(
      database,
      `SELECT count(*)::int AS count FROM users WHERE role = 'ADMIN' AND "deactivatedAt" IS NULL`,
    );

    if (count === 0) {
      throw new Error(
        'В копии нет ни одного активного администратора: после восстановления войти было бы некому',
      );
    }

    await this.databases.query(database, 'UPDATE users SET "hashedRefreshToken" = NULL');
  }

  private async readLastMigration(database: string): Promise<string | null> {
    try {
      const [row] = await this.databases.query<{ migration_name: string }>(
        database,
        `SELECT migration_name FROM _prisma_migrations
         WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
         ORDER BY migration_name DESC LIMIT 1`,
      );

      return row?.migration_name ?? null;
    } catch {
      return null;
    }
  }

  private async readAppLastMigration(): Promise<string | null> {
    try {
      const names = (await readdir(join(process.cwd(), 'prisma', 'migrations'))).filter((name) =>
        /^\d{14}_/.test(name),
      );

      return names.sort().at(-1) ?? null;
    } catch {
      return null;
    }
  }

  /** Хранится одна прежняя база: перед новой подменой удаляются оставшиеся от прошлых. */
  private async dropPreviousDatabases() {
    for (const name of await this.databases.listDatabases(this.previousDatabasePrefix)) {
      await this.databases.dropDatabase(name);
    }
  }

  private async commitSessions(
    previousDatabase: {
      name: string;
      restoredAt: string;
      backupId: string;
    } | null,
  ) {
    const sessionEpochMs = Date.now();
    setSessionEpochMs(sessionEpochMs);
    await this.storage.writeState({ sessionEpochMs, previousDatabase });
  }

  /** Автор восстановления может отсутствовать в восстановленной базе: тогда запись без автора. */
  private async recordAudit(
    action: AuditAction,
    entityId: string,
    userId: number,
    changes: Array<{ field: string; before: string | null; after: string | null }>,
  ) {
    try {
      const actor = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      await this.audit.record({
        entityType: 'DATABASE_BACKUP',
        entityId,
        action,
        actorUserId: actor?.id ?? null,
        changes,
      });
    } catch (error) {
      this.logger.warn(`Restore audit skipped: ${toErrorMessage(error)}`);
    }
  }
}
