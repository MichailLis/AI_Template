import {
  HttpException,
  HttpStatus,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';

import {
  PublicRateLimitSettingsService,
  type PublicRateLimit,
} from '../../app-settings/public-rate-limit-settings.service';

type Bucket = { tokens: number; refilledAt: number };

/** Сколько адресов помнить, прежде чем выбросить полные вёдра — те, что ничего не ограничивают. */
const MAX_TRACKED_BUCKETS = 10_000;

/**
 * Ведро токенов: `burst` запросов подряд, дальше `perMinute` в минуту. Каждый start и finish
 * создаёт попытку и запускает платный AI-анализ, поэтому без лимита скрипт со ссылкой тратит бюджет
 * (#124). Ведра в памяти процесса: бэкенд один, после перезапуска лимит начинается заново.
 */
export const takePublicRateLimitToken = (
  buckets: Map<string, Bucket>,
  key: string,
  { perMinute, burst }: PublicRateLimit,
  now: number,
) => {
  const refillPerMs = perMinute / 60_000;
  const bucket = buckets.get(key);
  const tokens = bucket
    ? Math.min(burst, bucket.tokens + (now - bucket.refilledAt) * refillPerMs)
    : burst;

  if (buckets.size > MAX_TRACKED_BUCKETS) {
    for (const [trackedKey, tracked] of buckets) {
      if (tracked.tokens + (now - tracked.refilledAt) * refillPerMs >= burst) {
        buckets.delete(trackedKey);
      }
    }
  }

  if (tokens < 1) {
    buckets.set(key, { tokens, refilledAt: now });
    return false;
  }

  buckets.set(key, { tokens: tokens - 1, refilledAt: now });
  return true;
};

/** Одно хранилище вёдер на процесс: guard Nest может создать в нескольких экземплярах. */
@Injectable()
export class PublicRateLimitBuckets {
  readonly buckets = new Map<string, Bucket>();
}

@Injectable()
export class PublicRateLimitGuard implements CanActivate {
  constructor(
    private readonly settings: PublicRateLimitSettingsService,
    private readonly store: PublicRateLimitBuckets,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    // Адрес ученика: за nginx его даёт `trust proxy` (setup-app.ts), иначе у всех был бы адрес nginx.
    const key = `${context.getHandler().name}|${request.ip ?? 'unknown'}`;

    if (
      !takePublicRateLimitToken(this.store.buckets, key, await this.settings.getLimit(), Date.now())
    ) {
      throw new HttpException(
        {
          message: 'Слишком много запросов с вашей сети. Подождите минуту и попробуйте снова.',
          error: 'RATE_LIMITED',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
