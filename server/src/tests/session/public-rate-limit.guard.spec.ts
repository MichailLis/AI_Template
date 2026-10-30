import { HttpStatus, type ExecutionContext } from '@nestjs/common';

import type { PublicRateLimitSettingsService } from '../../app-settings/public-rate-limit-settings.service';
import {
  PublicRateLimitBuckets,
  PublicRateLimitGuard,
  takePublicRateLimitToken,
} from './public-rate-limit.guard';

describe('takePublicRateLimitToken', () => {
  const limit = { perMinute: 60, burst: 3 };

  it('lets a burst through, then refuses until the bucket refills', () => {
    const { buckets } = new PublicRateLimitBuckets();
    const take = (now: number) => takePublicRateLimitToken(buckets, 'start|1.1.1.1', limit, now);

    expect([take(0), take(0), take(0), take(0)]).toEqual([true, true, true, false]);
    // 60 в минуту — один токен в секунду.
    expect(take(999)).toBe(false);
    expect(take(1000)).toBe(true);
  });

  it('keeps separate buckets per address and per route', () => {
    const { buckets } = new PublicRateLimitBuckets();
    for (let i = 0; i < 3; i += 1) takePublicRateLimitToken(buckets, 'start|1.1.1.1', limit, 0);

    expect(takePublicRateLimitToken(buckets, 'start|1.1.1.1', limit, 0)).toBe(false);
    expect(takePublicRateLimitToken(buckets, 'start|2.2.2.2', limit, 0)).toBe(true);
    expect(takePublicRateLimitToken(buckets, 'finish|1.1.1.1', limit, 0)).toBe(true);
  });
});

describe('PublicRateLimitGuard', () => {
  const createContext = (ip: string) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ ip }) }),
      getHandler: () => ({ name: 'startSession' }),
    }) as unknown as ExecutionContext;

  it('answers 429 RATE_LIMITED with the limit from settings', async () => {
    const settings = { getLimit: jest.fn().mockResolvedValue({ perMinute: 1, burst: 1 }) };
    const guard = new PublicRateLimitGuard(
      settings as unknown as PublicRateLimitSettingsService,
      new PublicRateLimitBuckets(),
    );

    await expect(guard.canActivate(createContext('1.1.1.1'))).resolves.toBe(true);
    const refused = guard.canActivate(createContext('1.1.1.1'));
    await expect(refused).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
    await expect(refused).rejects.toMatchObject({ response: { error: 'RATE_LIMITED' } });
  });
});
