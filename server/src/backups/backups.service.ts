import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';

import { AuditService } from '../audit/audit.service';
import type { AuditAction } from '../audit/audit.types';
import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { PrismaService } from '../prisma.service';
import { BackupSettingsService, getNextScheduledRun } from './backup-settings.service';
import { BackupStorage, isBackupId } from './backup-storage';
import { MaintenanceState } from './maintenance-state';
import { parsePgToolMajorVersion, toPgConnectionEnv } from './database-connection.utils';
import { PgToolMissingError, PgToolsRunner } from './pg-tools.runner';
import type { BackupMetadata, BackupTrigger } from './backups.types';

const DEFAULT_DUMP_TIMEOUT_MS = 30 * 60 * 1000;
const VERSION_CHECK_TIMEOUT_MS = 10_000;
const AVAILABILITY_CACHE_MS = 60_000;
const DOWNLOAD_LINK_TTL_MS = 60_000;
const ERROR_MESSAGE_LIMIT = 500;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Свободного места меньше, чем на столько копий, — показывается предупреждение. */
const LOW_SPACE_BACKUPS = 3;

const formatMegabytes = (bytes: number) => `${Math.ceil(bytes / 1024 / 1024)} МБ`;

export interface BackupAvailability {
  available: boolean;
  reason: string | null;
  pgDumpVersion: string | null;
  serverVersion: string | null;
}

interface DownloadLink {
  backupId: string;
  userId: number;
  expiresAt: number;
}

const readPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const formatBackupTimestamp = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');

/** Имя копии: время создания по UTC и случайный хвост, формат проверяет isBackupId. */
export const createBackupId = (date: Date) =>
  `backup-${formatBackupTimestamp(date)}-${randomBytes(3).toString('hex')}`;

const toErrorMessage = (error: unknown) => {
  if (error instanceof PgToolMissingError) {
    return 'pg_dump не установлен в контейнере backend';
  }

  const message = error instanceof Error ? error.message : String(error);

  return message.slice(0, ERROR_MESSAGE_LIMIT) || 'Неизвестная ошибка';
};

/**
 * Резервные копии базы через `pg_dump`. Копия создается в фоне: ответ на запрос не ждет дампа,
 * которому nginx иначе оборвал бы соединение через минуту. Одновременно выполняется только одна
 * операция; контейнер backend один, поэтому замка в памяти достаточно.
 */
@Injectable()
export class BackupsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BackupsService.name);
  private readonly dumpTimeoutMs: number;
  private activeBackupId: string | null = null;
  private activeRun: Promise<void> | null = null;
  private availabilityCache: { checkedAt: number; value: BackupAvailability } | null = null;
  private readonly downloadLinks = new Map<string, DownloadLink>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
    private readonly storage: BackupStorage,
    private readonly runner: PgToolsRunner,
    private readonly settingsService: BackupSettingsService,
    private readonly maintenance: MaintenanceState,
  ) {
    this.dumpTimeoutMs = readPositiveInt(
      config.get<string>('BACKUP_TIMEOUT_MS'),
      DEFAULT_DUMP_TIMEOUT_MS,
    );
  }

  /** Копия, которую оборвал перезапуск сервера, иначе навсегда осталась бы «в работе». */
  async onApplicationBootstrap() {
    try {
      for (const backup of await this.storage.list()) {
        if (backup.status === 'RUNNING') {
          await this.storage.removePartialDump(backup.id);
          await this.storage.write({
            ...backup,
            status: 'FAILED',
            completedAt: new Date().toISOString(),
            errorMessage: 'Создание копии прервано перезапуском сервера',
          });
        }
      }
    } catch (error) {
      this.logger.warn(`Backup recovery skipped: ${toErrorMessage(error)}`);
    }
  }

  async getOverview(userId: number) {
    await ensureAdminAccess(this.prisma, userId);

    const [availability, backups, settings] = await Promise.all([
      this.getAvailability(),
      this.storage.list(),
      this.settingsService.getSettings(),
    ]);

    return {
      availability,
      storage: await this.getStorageUsage(backups),
      settings,
      nextScheduledAt: getNextScheduledRun(settings, new Date())?.toISOString() ?? null,
      isBusy: this.activeBackupId !== null,
      backups: await this.toResponseItems(backups),
    };
  }

  async createBackup(userId: number) {
    await ensureAdminAccess(this.prisma, userId);

    const backup = await this.startBackup('MANUAL', userId);
    const [item] = await this.toResponseItems([backup]);

    return { backup: item };
  }

  get isBusy() {
    return this.activeBackupId !== null;
  }

  /**
   * Общий запуск для кнопки и расписания: права проверяет вызывающий. Возвращается описание копии
   * в статусе RUNNING, сам дамп идет в фоне.
   */
  async startBackup(trigger: BackupTrigger, userId: number | null): Promise<BackupMetadata> {
    if (this.activeBackupId) {
      throw new ConflictException('Копия уже создается, дождитесь окончания', 'BACKUP_IN_PROGRESS');
    }

    if (this.maintenance.isActive) {
      throw new ConflictException('Идет восстановление базы', 'RESTORE_IN_PROGRESS');
    }

    const now = new Date();
    const id = createBackupId(now);
    // Замок берется до первого await: иначе два почти одновременных запроса оба прошли бы проверку.
    this.activeBackupId = id;

    let backup: BackupMetadata;

    try {
      const availability = await this.getAvailability({ force: true });

      if (!availability.available) {
        throw new ConflictException(
          availability.reason ?? 'Резервное копирование недоступно',
          'BACKUP_UNAVAILABLE',
        );
      }

      await this.assertEnoughFreeSpace();

      backup = {
        id,
        fileName: `${id}.dump`,
        status: 'RUNNING',
        trigger,
        createdAt: now.toISOString(),
        completedAt: null,
        createdByUserId: userId,
        sizeBytes: null,
        sha256: null,
        serverVersion: availability.serverVersion,
        lastMigration: await this.readLastMigration(),
        errorMessage: null,
        originalFileName: null,
      };

      await this.storage.write(backup);
    } catch (error) {
      this.activeBackupId = null;
      throw error;
    }

    this.activeRun = this.runBackup(backup);

    return backup;
  }

  /** Ждет окончания текущей копии и возвращает ее итоговое описание. */
  async waitForBackup(id: string): Promise<BackupMetadata | null> {
    if (this.activeBackupId === id && this.activeRun) {
      await this.activeRun;
    }

    return this.storage.read(id);
  }

  async deleteBackup(userId: number, id: string) {
    await ensureAdminAccess(this.prisma, userId);

    const backup = await this.findBackup(id);

    if (backup.status === 'RUNNING') {
      throw new ConflictException('Копия еще создается', 'BACKUP_IN_PROGRESS');
    }

    await this.storage.remove(id);
    await this.recordAudit('BACKUP_DELETED', backup, userId);

    return { id };
  }

  async createDownloadLink(userId: number, id: string) {
    await ensureAdminAccess(this.prisma, userId);

    const backup = await this.findBackup(id);

    if (backup.status !== 'READY' || !(await this.storage.dumpExists(id))) {
      throw new ConflictException('Файл копии недоступен для скачивания', 'BACKUP_NOT_READY');
    }

    this.dropExpiredDownloadLinks();

    const token = randomBytes(32).toString('base64url');
    const expiresAt = Date.now() + DOWNLOAD_LINK_TTL_MS;
    this.downloadLinks.set(token, { backupId: id, userId, expiresAt });

    return {
      path: `/admin/backups/download/${token}`,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  /**
   * Браузер скачивает файл обычной ссылкой, без заголовка авторизации, поэтому доступ дает
   * одноразовый короткоживущий токен. Права админа проверяются еще раз в момент скачивания.
   */
  async openDownload(token: string) {
    const link = this.downloadLinks.get(token);
    this.downloadLinks.delete(token);

    if (!link || link.expiresAt < Date.now()) {
      throw new NotFoundException('Ссылка на скачивание устарела, запросите новую');
    }

    await ensureAdminAccess(this.prisma, link.userId);

    const backup = await this.findBackup(link.backupId);

    if (backup.status !== 'READY' || !(await this.storage.dumpExists(backup.id))) {
      throw new NotFoundException('Файл копии не найден');
    }

    await this.recordAudit('BACKUP_DOWNLOADED', backup, link.userId);

    return {
      fileName: backup.fileName,
      sizeBytes: backup.sizeBytes,
      stream: this.storage.openDump(backup.id),
    };
  }

  async getAvailability({ force = false } = {}): Promise<BackupAvailability> {
    const cached = this.availabilityCache;

    if (!force && cached && Date.now() - cached.checkedAt < AVAILABILITY_CACHE_MS) {
      return cached.value;
    }

    const value = await this.checkAvailability();
    this.availabilityCache = { checkedAt: Date.now(), value };

    return value;
  }

  private async checkAvailability(): Promise<BackupAvailability> {
    const serverVersion = await this.readServerVersion();
    const unavailable = (reason: string, pgDumpVersion: string | null = null) => ({
      available: false,
      reason,
      pgDumpVersion,
      serverVersion: serverVersion?.text ?? null,
    });

    let pgDumpVersion: string;

    try {
      pgDumpVersion = (
        await this.runner.run('pg_dump', ['--version'], {
          env: {},
          timeoutMs: VERSION_CHECK_TIMEOUT_MS,
        })
      ).trim();
    } catch (error) {
      return unavailable(toErrorMessage(error));
    }

    const clientMajor = parsePgToolMajorVersion(pgDumpVersion);

    // pg_dump умеет снимать копии с серверов своей версии и старше, но не новее.
    if (serverVersion && clientMajor !== null && clientMajor < serverVersion.major) {
      return unavailable(
        `pg_dump ${clientMajor} старее сервера PostgreSQL ${serverVersion.major}: обновите образ backend`,
        pgDumpVersion,
      );
    }

    try {
      await this.storage.ensureWritable();
    } catch {
      return unavailable(
        `Каталог для копий ${this.storage.directory} недоступен для записи`,
        pgDumpVersion,
      );
    }

    return {
      available: true,
      reason: null,
      pgDumpVersion,
      serverVersion: serverVersion?.text ?? null,
    };
  }

  private async runBackup(backup: BackupMetadata) {
    try {
      await this.runner.run(
        'pg_dump',
        [
          '--format=custom',
          '--no-owner',
          '--no-acl',
          `--file=${this.storage.partialDumpPath(backup.id)}`,
        ],
        {
          env: toPgConnectionEnv(this.config.get<string>('DATABASE_URL') ?? ''),
          timeoutMs: this.dumpTimeoutMs,
        },
      );

      const file = await this.storage.publishPartialDump(backup.id);
      const ready: BackupMetadata = {
        ...backup,
        ...file,
        status: 'READY',
        completedAt: new Date().toISOString(),
      };

      await this.storage.write(ready);
      await this.recordAudit('BACKUP_CREATED', ready, backup.createdByUserId);
      await this.pruneExpiredBackups();
    } catch (error) {
      const failed: BackupMetadata = {
        ...backup,
        status: 'FAILED',
        completedAt: new Date().toISOString(),
        errorMessage: toErrorMessage(error),
      };

      this.logger.error(`Backup ${backup.id} failed: ${failed.errorMessage}`);
      await this.storage.removePartialDump(backup.id).catch(() => undefined);
      await this.storage.write(failed).catch(() => undefined);
      await this.recordAudit('BACKUP_FAILED', failed, backup.createdByUserId).catch(
        () => undefined,
      );
    } finally {
      this.activeBackupId = null;
      this.activeRun = null;
    }
  }

  /**
   * Хранятся копии моложе срока хранения и не больше заданного числа. Последняя успешная копия
   * не удаляется никогда, даже если она старше срока: иначе долгий простой оставил бы ноль копий.
   */
  private async pruneExpiredBackups() {
    const { retentionDays, maxCount } = await this.settingsService.getSettings();
    const expiresBefore = new Date(Date.now() - retentionDays * DAY_MS).toISOString();
    const backups = (await this.storage.list()).filter((backup) => backup.status !== 'RUNNING');
    const latestReadyId = backups.find((backup) => backup.status === 'READY')?.id;

    for (const [index, backup] of backups.entries()) {
      // Загруженная админом копия удаляется только вручную: ее загрузили, чтобы восстановить.
      if (backup.id === latestReadyId || backup.trigger === 'IMPORTED') {
        continue;
      }

      if (backup.createdAt < expiresBefore || index >= maxCount) {
        await this.storage.remove(backup.id);

        if (backup.status === 'READY') {
          await this.recordAudit('BACKUP_DELETED', backup, null);
        }
      }
    }
  }

  private async assertEnoughFreeSpace() {
    const [freeBytes, databaseBytes] = await Promise.all([
      this.storage.freeBytes(),
      this.getDatabaseSizeBytes(),
    ]);

    // Сжатый дамп заметно меньше базы с индексами, поэтому размер базы — запас с избытком.
    if (freeBytes !== null && databaseBytes !== null && freeBytes < databaseBytes) {
      throw new ConflictException(
        `Недостаточно места на диске для резервной копии: свободно ${formatMegabytes(freeBytes)}, нужно около ${formatMegabytes(databaseBytes)}. Удалите старые копии или освободите место на сервере`,
        'BACKUP_NO_SPACE',
      );
    }
  }

  async getDatabaseSizeBytes(): Promise<number | null> {
    try {
      const [{ size }] = await this.prisma.$queryRaw<Array<{ size: bigint }>>`
        SELECT pg_database_size(current_database()) AS size
      `;

      return Number(size);
    } catch {
      return null;
    }
  }

  /**
   * Сколько места на диске под копии: свободно, занято копиями, размер базы. Предупреждение
   * загорается, когда свободного места меньше, чем на три копии размера последней (или базы).
   */
  private async getStorageUsage(backups: BackupMetadata[]) {
    const [freeBytes, databaseBytes] = await Promise.all([
      this.storage.freeBytes(),
      this.getDatabaseSizeBytes(),
    ]);
    const ready = backups.filter((backup) => backup.status === 'READY');
    const usedBytes = ready.reduce((total, backup) => total + (backup.sizeBytes ?? 0), 0);
    const estimatedBackupBytes = ready[0]?.sizeBytes ?? databaseBytes ?? 0;
    const lowSpace =
      freeBytes !== null &&
      (freeBytes < estimatedBackupBytes * LOW_SPACE_BACKUPS ||
        (databaseBytes !== null && freeBytes < databaseBytes));

    return { freeBytes, usedBytes, databaseBytes, lowSpace };
  }

  /**
   * Копия, которую не удалось даже начать (нет места, нет pg_dump), тоже попадает в список со
   * статусом «Ошибка»: иначе пропущенная плановая копия видна только в логе сервера.
   */
  async recordFailedBackup(trigger: BackupTrigger, userId: number | null, reason: string) {
    const now = new Date().toISOString();
    const id = createBackupId(new Date());
    const failed: BackupMetadata = {
      id,
      fileName: `${id}.dump`,
      status: 'FAILED',
      trigger,
      createdAt: now,
      completedAt: now,
      createdByUserId: userId,
      sizeBytes: null,
      sha256: null,
      serverVersion: null,
      lastMigration: null,
      errorMessage: reason.slice(0, ERROR_MESSAGE_LIMIT),
      originalFileName: null,
    };

    await this.storage.write(failed);
    await this.recordAudit('BACKUP_FAILED', failed, userId);

    return failed;
  }

  private async readServerVersion() {
    try {
      const [row] = await this.prisma.$queryRaw<Array<{ num: string; text: string }>>`
        SELECT current_setting('server_version_num') AS num, current_setting('server_version') AS text
      `;

      return { major: Math.floor(Number(row.num) / 10000), text: row.text };
    } catch {
      return null;
    }
  }

  /** Локальная база, созданная через `prisma db push`, таблицы миграций не имеет. */
  private async readLastMigration() {
    try {
      const [row] = await this.prisma.$queryRaw<Array<{ migration_name: string }>>`
        SELECT migration_name FROM _prisma_migrations
        WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
        ORDER BY migration_name DESC
        LIMIT 1
      `;

      return row?.migration_name ?? null;
    } catch {
      return null;
    }
  }

  async findBackup(id: string) {
    const backup = isBackupId(id) ? await this.storage.read(id) : null;

    if (!backup) {
      throw new NotFoundException('Резервная копия не найдена');
    }

    return backup;
  }

  private dropExpiredDownloadLinks() {
    const now = Date.now();

    for (const [token, link] of this.downloadLinks) {
      if (link.expiresAt < now) {
        this.downloadLinks.delete(token);
      }
    }
  }

  private recordAudit(action: AuditAction, backup: BackupMetadata, actorUserId: number | null) {
    return this.audit.record({
      entityType: 'DATABASE_BACKUP',
      entityId: backup.id,
      action,
      actorUserId,
      changes: [
        { field: 'fileName', before: null, after: backup.fileName },
        ...(backup.errorMessage
          ? [{ field: 'errorMessage', before: null, after: backup.errorMessage }]
          : []),
      ],
    });
  }

  async toResponseItems(backups: BackupMetadata[]) {
    const userIds = [
      ...new Set(
        backups.map((backup) => backup.createdByUserId).filter((id): id is number => id !== null),
      ),
    ];
    const users =
      userIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, email: true, name: true },
          })
        : [];
    const usersById = new Map(users.map((user) => [user.id, user]));

    return backups.map((backup) => ({
      id: backup.id,
      fileName: backup.fileName,
      status: backup.status,
      trigger: backup.trigger,
      createdAt: backup.createdAt,
      completedAt: backup.completedAt,
      sizeBytes: backup.sizeBytes,
      sha256: backup.sha256,
      errorMessage: backup.errorMessage,
      originalFileName: backup.originalFileName,
      createdBy:
        backup.createdByUserId === null ? null : (usersById.get(backup.createdByUserId) ?? null),
    }));
  }
}
