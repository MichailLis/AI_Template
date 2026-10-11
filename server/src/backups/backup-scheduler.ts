import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';

import { BackupSettingsService, getCurrentScheduleSlot } from './backup-settings.service';
import { BackupStorage } from './backup-storage';
import { BackupsService } from './backups.service';

const CHECK_INTERVAL_MS = 10 * 60 * 1000;
/** Свежая успешная копия за это время делает плановую лишней, кто бы ее ни создал. */
const FRESH_BACKUP_MS = 20 * 60 * 60 * 1000;

/**
 * Ежедневная копия по расписанию. Раз в десять минут проверяет, наступил ли час запуска; без
 * отдельной библиотеки cron, потому что точность до минут здесь не нужна. Пропущенный из-за
 * простоя запуск выполняется при следующей проверке, а неудачный не повторяется до следующего дня.
 */
@Injectable()
export class BackupScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BackupScheduler.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly backups: BackupsService,
    private readonly settingsService: BackupSettingsService,
    private readonly storage: BackupStorage,
  ) {}

  onModuleInit() {
    if (process.env.SKIP_DB_CONNECT === 'true') {
      return;
    }

    this.timer = setInterval(() => {
      void this.runIfDue().catch((error: unknown) => {
        this.logger.warn(`Scheduled backup check failed: ${String(error)}`);
      });
    }, CHECK_INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Возвращает true, если плановая копия была запущена. */
  async runIfDue(now = new Date()): Promise<boolean> {
    const settings = await this.settingsService.getSettings();

    if (!settings.scheduleEnabled || this.backups.isBusy) {
      return false;
    }

    const slot = getCurrentScheduleSlot(settings, now).toISOString();
    const freshSince = new Date(now.getTime() - FRESH_BACKUP_MS).toISOString();
    const backups = await this.storage.list();
    const alreadyCovered = backups.some(
      (backup) =>
        (backup.status === 'READY' && backup.createdAt >= freshSince) ||
        (backup.trigger === 'SCHEDULED' && backup.createdAt >= slot),
    );

    if (alreadyCovered) {
      return false;
    }

    const availability = await this.backups.getAvailability({ force: true });

    if (!availability.available) {
      await this.recordSkipped(availability.reason ?? 'Резервное копирование недоступно');
      return false;
    }

    try {
      await this.backups.startBackup('SCHEDULED', null);
    } catch (error) {
      await this.recordSkipped(error instanceof Error ? error.message : String(error));
      return false;
    }

    return true;
  }

  /**
   * Пропуск записывается в список как неудачная плановая копия: админ видит причину (например,
   * нехватку места), а повтор до следующего дня не запускается, потому что слот уже занят.
   */
  private async recordSkipped(reason: string) {
    this.logger.warn(`Scheduled backup skipped: ${reason}`);

    if (await this.storage.exists()) {
      await this.backups.recordFailedBackup('SCHEDULED', null, reason);
    }
  }
}
