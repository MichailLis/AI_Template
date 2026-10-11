import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { constants, createReadStream } from 'node:fs';
import {
  access,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  statfs,
  writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';

import {
  BackupMetadataSchema,
  BackupSettingsSchema,
  type BackupMetadata,
  type BackupSettings,
} from './backups.types';

export const DEFAULT_BACKUP_DIR = '/backups';

/** Идентификатор попадает в путь к файлу, поэтому формат проверяется до любого обращения к диску. */
const BACKUP_ID_PATTERN = /^backup-\d{8}T\d{6}Z-[a-f0-9]{6}$/;

export const isBackupId = (value: string) => BACKUP_ID_PATTERN.test(value);

const isMissingFileError = (error: unknown) =>
  typeof error === 'object' && error !== null && (error as NodeJS.ErrnoException).code === 'ENOENT';

/**
 * Копии и их описания лежат в одном каталоге (том `/backups`), а не в базе: восстановление
 * перезаписывает базу целиком, и список копий не должен откатываться вместе с ней.
 * На каждую копию три файла: `<id>.dump`, `<id>.json` и временный `<id>.dump.partial`.
 */
@Injectable()
export class BackupStorage {
  readonly directory: string;

  constructor(config: ConfigService) {
    this.directory = config.get<string>('BACKUP_DIR')?.trim() || DEFAULT_BACKUP_DIR;
  }

  dumpPath(id: string) {
    return join(this.directory, `${id}.dump`);
  }

  partialDumpPath(id: string) {
    return `${this.dumpPath(id)}.partial`;
  }

  private metadataPath(id: string) {
    return join(this.directory, `${id}.json`);
  }

  private get settingsPath() {
    return join(this.directory, 'settings.json');
  }

  async exists() {
    try {
      return (await stat(this.directory)).isDirectory();
    } catch {
      return false;
    }
  }

  async ensureWritable() {
    await mkdir(this.directory, { recursive: true });
    await access(this.directory, constants.W_OK);
  }

  async list(): Promise<BackupMetadata[]> {
    if (!(await this.exists())) {
      return [];
    }

    const fileNames = await readdir(this.directory);
    const backups: BackupMetadata[] = [];

    for (const fileName of fileNames) {
      const id = fileName.endsWith('.json') ? fileName.slice(0, -'.json'.length) : null;

      if (!id || !isBackupId(id)) {
        continue;
      }

      const backup = await this.read(id);

      if (backup) {
        backups.push(backup);
      }
    }

    return backups.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  /** Поврежденное описание не должно ронять весь список: такая копия просто не показывается. */
  async read(id: string): Promise<BackupMetadata | null> {
    if (!isBackupId(id)) {
      return null;
    }

    try {
      const parsed = BackupMetadataSchema.safeParse(
        JSON.parse(await readFile(this.metadataPath(id), 'utf8')),
      );

      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  async write(backup: BackupMetadata) {
    await this.writeJsonAtomically(this.metadataPath(backup.id), backup);
  }

  /** `null` — настройки еще не сохранялись или файл поврежден: действуют значения по умолчанию. */
  async readSettings(): Promise<BackupSettings | null> {
    try {
      const parsed = BackupSettingsSchema.safeParse(
        JSON.parse(await readFile(this.settingsPath, 'utf8')),
      );

      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  async writeSettings(settings: BackupSettings) {
    await this.ensureWritable();
    await this.writeJsonAtomically(this.settingsPath, settings);
  }

  /** Запись через временный файл: прерванная запись не оставляет полупустой JSON. */
  private async writeJsonAtomically(path: string, value: unknown) {
    const temporaryPath = `${path}.tmp`;

    await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    await rename(temporaryPath, path);
  }

  async remove(id: string) {
    await Promise.all(
      [this.dumpPath(id), this.partialDumpPath(id), this.metadataPath(id)].map((path) =>
        rm(path, { force: true }),
      ),
    );
  }

  async removePartialDump(id: string) {
    await rm(this.partialDumpPath(id), { force: true });
  }

  /** Готовый файл появляется под своим именем только целиком. */
  async publishPartialDump(id: string) {
    const path = this.dumpPath(id);
    await rename(this.partialDumpPath(id), path);

    return this.describeFile(path);
  }

  async dumpExists(id: string) {
    try {
      return (await stat(this.dumpPath(id))).isFile();
    } catch (error) {
      if (isMissingFileError(error)) {
        return false;
      }

      throw error;
    }
  }

  openDump(id: string) {
    return createReadStream(this.dumpPath(id));
  }

  /** Свободное место в каталоге копий; `null`, если файловая система его не сообщает. */
  async freeBytes(): Promise<number | null> {
    try {
      const stats = await statfs(this.directory);

      return Number(stats.bavail) * Number(stats.bsize);
    } catch {
      return null;
    }
  }

  private async describeFile(path: string) {
    const hash = createHash('sha256');
    await pipeline(createReadStream(path), hash);

    return {
      sizeBytes: (await stat(path)).size,
      sha256: hash.digest('hex'),
    };
  }
}
