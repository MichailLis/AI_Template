import { Injectable } from '@nestjs/common';

/**
 * Режим обслуживания на время подмены базы: пока он включен, API отвечает 503, а новые копии
 * не запускаются. Контейнер backend один, поэтому флага в памяти достаточно.
 */
@Injectable()
export class MaintenanceState {
  private reason: string | null = null;

  get isActive() {
    return this.reason !== null;
  }

  get message() {
    return this.reason;
  }

  activate(reason: string) {
    this.reason = reason;
  }

  deactivate() {
    this.reason = null;
  }
}
