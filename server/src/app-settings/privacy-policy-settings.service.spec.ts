import { BadRequestException } from '@nestjs/common';

import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { PrismaService } from '../prisma.service';
import { PrivacyPolicySettingsService } from './privacy-policy-settings.service';
import type { AuditService } from '../audit/audit.service';

jest.mock('../common/authz/admin-access.utils', () => ({
  ensureAdminAccess: jest.fn().mockResolvedValue(undefined),
}));

describe('PrivacyPolicySettingsService', () => {
  let service: PrivacyPolicySettingsService;
  let auditMock: { record: jest.Mock; listForEntity: jest.Mock };
  let prismaMock: {
    $transaction: jest.Mock;
    appSetting: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
    testPublicLink: {
      updateMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaMock = {
      $transaction: jest.fn(),
      appSetting: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      testPublicLink: {
        updateMany: jest.fn(),
      },
    };
    prismaMock.$transaction.mockImplementation(
      (callback: (transaction: typeof prismaMock) => unknown) => callback(prismaMock),
    );
    auditMock = {
      record: jest.fn().mockResolvedValue(undefined),
      listForEntity: jest.fn().mockResolvedValue([]),
    };
    service = new PrivacyPolicySettingsService(
      prismaMock as unknown as PrismaService,
      auditMock as unknown as AuditService,
    );
    jest.mocked(ensureAdminAccess).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Находка аудита FLOW-06: у настроек не было следа, кто и когда поменял политику
   * конфиденциальности. Текст политики длинный и в журнал не пишется — только факт его изменения.
   */
  describe('audit trail', () => {
    const storedPolicy = {
      key: 'privacy.policy',
      value: JSON.stringify({
        version: '2026-07-01',
        publishedAt: '2026-07-01T00:00:00.000Z',
        content: 'Старая политика',
        operatorFullName: 'ООО «Оператор»',
      }),
      updatedAt: new Date('2026-07-01T12:00:00.000Z'),
    };

    beforeEach(() => {
      prismaMock.appSetting.findUnique.mockResolvedValue(storedPolicy);
      prismaMock.appSetting.upsert.mockResolvedValue({
        ...storedPolicy,
        updatedAt: new Date('2026-07-10T12:00:00.000Z'),
      });
      prismaMock.testPublicLink.updateMany.mockResolvedValue({ count: 0 });
    });

    it('records the policy version and date change and marks a new text', async () => {
      await service.updatePrivacyPolicy(3, {
        version: '2026-07-10',
        publishedAt: '2026-07-10T00:00:00.000Z',
        content: 'Новая политика',
        operatorFullName: 'ООО «Оператор»',
      });

      expect(auditMock.record).toHaveBeenCalledWith({
        entityType: 'APP_SETTING',
        entityId: 'privacy-policy',
        action: 'SETTING_UPDATED',
        actorUserId: 3,
        changes: [
          { field: 'version', before: '2026-07-01', after: '2026-07-10' },
          {
            field: 'publishedAt',
            before: '2026-07-01T00:00:00.000Z',
            after: '2026-07-10T00:00:00.000Z',
          },
          { field: 'content', before: null, after: null },
        ],
      });
    });

    it('records nothing when the same policy is saved again', async () => {
      await service.updatePrivacyPolicy(3, {
        version: '2026-07-01',
        publishedAt: '2026-07-01T00:00:00.000Z',
        content: 'Старая политика',
        operatorFullName: 'ООО «Оператор»',
      });

      expect(auditMock.record).not.toHaveBeenCalled();
    });
  });

  it('returns bundled public policy when database setting is missing', async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue(null);

    const response = await service.getPublicPrivacyPolicy();

    expect(response).toMatchObject({
      privacyPolicy: {
        version: '2026-07-09',
        publishedAt: '2026-07-09T00:00:00.000Z',
        updatedAt: null,
      },
    });
    expect(response.privacyPolicy.content).toContain('ПОЛИТИКА');
  });

  it('returns stored policy payload when it is valid', async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue({
      key: 'privacy.policy',
      value: JSON.stringify({
        version: '2026-07-10',
        publishedAt: '2026-07-10T00:00:00.000Z',
        content: 'Опубликованная политика',
      }),
      updatedAt: new Date('2026-07-10T12:00:00.000Z'),
    });

    await expect(service.getPublicPrivacyPolicy()).resolves.toEqual({
      privacyPolicy: {
        version: '2026-07-10',
        publishedAt: '2026-07-10T00:00:00.000Z',
        content: 'Опубликованная политика',
        updatedAt: '2026-07-10T12:00:00.000Z',
      },
    });
  });

  it('falls back to bundled policy when stored JSON is invalid', async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue({
      key: 'privacy.policy',
      value: '{"version":""}',
      updatedAt: new Date('2026-07-10T12:00:00.000Z'),
    });

    const response = await service.getPublicPrivacyPolicy();

    expect(response).toMatchObject({
      privacyPolicy: {
        version: '2026-07-09',
        updatedAt: null,
      },
    });
    expect(response.privacyPolicy.content).toContain('ПОЛИТИКА');
  });

  it('checks admin access before returning admin policy settings', async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue(null);

    await service.getAdminPrivacyPolicy(3);

    expect(ensureAdminAccess).toHaveBeenCalledWith(prismaMock, 3);
  });

  it('returns the default platform operator name for legacy stored policy settings', async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue({
      key: 'privacy.policy',
      value: JSON.stringify({
        version: '2026-07-10',
        publishedAt: '2026-07-10T00:00:00.000Z',
        content: 'Опубликованная политика',
      }),
      updatedAt: new Date('2026-07-10T12:00:00.000Z'),
    });

    await expect(service.getAdminPrivacyPolicy(3)).resolves.toMatchObject({
      privacyPolicy: {
        operatorFullName: 'АНО «Центр развития компьютерного спорта и цифровых технологий»',
      },
    });
  });

  it('saves trimmed policy settings as JSON', async () => {
    prismaMock.appSetting.upsert.mockResolvedValue({
      key: 'privacy.policy',
      value: JSON.stringify({
        version: '2026-07-10',
        publishedAt: '2026-07-10T00:00:00.000Z',
        content: 'Новая политика',
      }),
      updatedAt: new Date('2026-07-10T12:00:00.000Z'),
    });

    await expect(
      service.updatePrivacyPolicy(3, {
        version: ' 2026-07-10 ',
        publishedAt: '2026-07-10T00:00:00.000Z',
        content: ' Новая политика ',
        operatorFullName: ' ООО «Новый оператор» ',
      }),
    ).resolves.toEqual({
      privacyPolicy: {
        version: '2026-07-10',
        publishedAt: '2026-07-10T00:00:00.000Z',
        content: 'Новая политика',
        operatorFullName: 'ООО «Новый оператор»',
        updatedAt: '2026-07-10T12:00:00.000Z',
      },
    });

    expect(ensureAdminAccess).toHaveBeenCalledWith(prismaMock, 3);
    expect(prismaMock.appSetting.upsert).toHaveBeenCalledWith({
      where: {
        key: 'privacy.policy',
      },
      create: {
        key: 'privacy.policy',
        value: JSON.stringify({
          version: '2026-07-10',
          publishedAt: '2026-07-10T00:00:00.000Z',
          content: 'Новая политика',
          operatorFullName: 'ООО «Новый оператор»',
        }),
      },
      update: {
        value: JSON.stringify({
          version: '2026-07-10',
          publishedAt: '2026-07-10T00:00:00.000Z',
          content: 'Новая политика',
          operatorFullName: 'ООО «Новый оператор»',
        }),
      },
    });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.testPublicLink.updateMany).toHaveBeenCalledWith({
      where: { personalDataProcessingMode: 'PUBLIC' },
      data: { operatorFullNameSnapshot: 'ООО «Новый оператор»' },
    });
  });

  it('rejects empty policy content before saving', async () => {
    await expect(
      service.updatePrivacyPolicy(3, {
        version: '2026-07-10',
        publishedAt: '2026-07-10T00:00:00.000Z',
        content: '   ',
        operatorFullName: 'ООО «Оператор»',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.appSetting.upsert).not.toHaveBeenCalled();
  });

  it('rejects an empty platform operator name before saving', async () => {
    await expect(
      service.updatePrivacyPolicy(3, {
        version: '2026-07-10',
        publishedAt: '2026-07-10T00:00:00.000Z',
        content: 'Политика',
        operatorFullName: '   ',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.testPublicLink.updateMany).not.toHaveBeenCalled();
  });

  it('returns active policy snapshot for new attempts', async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue({
      key: 'privacy.policy',
      value: JSON.stringify({
        version: '2026-07-10',
        publishedAt: '2026-07-10T00:00:00.000Z',
        content: 'Опубликованная политика',
      }),
      updatedAt: new Date('2026-07-10T12:00:00.000Z'),
    });

    await expect(service.getActivePolicySnapshot()).resolves.toEqual({
      version: '2026-07-10',
      publishedAt: new Date('2026-07-10T00:00:00.000Z'),
      content: 'Опубликованная политика',
    });
  });
});
