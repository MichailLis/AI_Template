import type { AuditService } from '../audit/audit.service';
import type { PrismaService } from '../prisma.service';
import {
  DEFAULT_PUBLIC_RATE_LIMIT,
  PublicRateLimitSettingsService,
} from './public-rate-limit-settings.service';

describe('PublicRateLimitSettingsService', () => {
  const createService = (stored: Array<{ key: string; value: string; updatedAt: Date }>) => {
    const tx = { appSetting: { upsert: jest.fn() } };
    const prisma = {
      appSetting: { findMany: jest.fn().mockResolvedValue(stored) },
      $transaction: jest.fn((run: (client: typeof tx) => unknown) => run(tx)),
    };
    const audit = { record: jest.fn() };
    const service = new PublicRateLimitSettingsService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    );
    return { service, tx, audit };
  };

  it('falls back to 60 per minute with a burst of 120 when nothing valid is stored', async () => {
    const { service } = createService([
      { key: 'publicRateLimit.perMinute', value: 'abc', updatedAt: new Date() },
    ]);

    await expect(service.getLimit()).resolves.toEqual(DEFAULT_PUBLIC_RATE_LIMIT);
    expect(DEFAULT_PUBLIC_RATE_LIMIT).toEqual({ perMinute: 60, burst: 120 });
  });

  it('saves both values and records the change in the audit log', async () => {
    const { service, tx, audit } = createService([]);

    await service.updateSettings(5, { perMinute: 30, burst: 60 });

    expect(tx.appSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'publicRateLimit.perMinute' },
        update: { value: '30' },
      }),
    );
    expect(tx.appSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { key: 'publicRateLimit.burst' }, update: { value: '60' } }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'APP_SETTING',
        entityId: 'public-rate-limit',
        action: 'SETTING_UPDATED',
        actorUserId: 5,
      }),
      tx,
    );
  });
});
