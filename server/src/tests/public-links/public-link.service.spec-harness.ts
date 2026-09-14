import { PrismaService } from '../../prisma.service';
import { PrivacyPolicySettingsService } from '../../app-settings/privacy-policy-settings.service';
import { ensureAdminAccess } from '../../common/authz/admin-access.utils';
import { TestsEducationOrganizationService } from './education-organization.service';
import { TestsPublicLinkService } from './public-link.service';

import type { AuditService } from '../../audit/audit.service';

/**
 * Общая обвязка спек TestsPublicLinkService: моки Prisma, аудита и настроек политики, собранный
 * сервис и фикстуры записей ссылки. Спеки разделены по темам (настройки ссылки, журнал изменений),
 * чтобы файл не рос за предел сопровождаемости. Модуль не является спекой и сам тестов не содержит.
 * jest.mock для ensureAdminAccess объявляется в каждой спеке, которая импортирует этот модуль.
 */

type PublicLinkMutationInput = {
  data: Record<string, unknown>;
  [key: string]: unknown;
};

export interface PublicLinkServiceHarness {
  service: TestsPublicLinkService;
  privacyPolicySettingsService: {
    getPlatformOperatorFullName: jest.Mock;
  };
  auditMock: { record: jest.Mock; listForEntity: jest.Mock };
  prismaMock: {
    educationOrganization: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    testPublicLink: {
      create: jest.Mock<Promise<unknown>, [PublicLinkMutationInput]>;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock<Promise<unknown>, [PublicLinkMutationInput]>;
    };
    testTopicVersion: {
      findUnique: jest.Mock;
    };
    $transaction: jest.Mock;
  };
}

export const createPublicLinkServiceHarness = (): PublicLinkServiceHarness => {
  const prismaMock: PublicLinkServiceHarness['prismaMock'] = {
    $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(prismaMock)),
    educationOrganization: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    testPublicLink: {
      create: jest.fn<Promise<unknown>, [PublicLinkMutationInput]>(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn<Promise<unknown>, [PublicLinkMutationInput]>(),
    },
    testTopicVersion: {
      findUnique: jest.fn(),
    },
  };

  const educationOrganizationService = new TestsEducationOrganizationService(
    prismaMock as unknown as PrismaService,
  );
  const privacyPolicySettingsService = {
    getPlatformOperatorFullName: jest.fn().mockResolvedValue('ООО «Новый оператор»'),
  };
  const auditMock = {
    record: jest.fn().mockResolvedValue(undefined),
    listForEntity: jest.fn().mockResolvedValue([]),
  };

  const service = new TestsPublicLinkService(
    prismaMock as unknown as PrismaService,
    educationOrganizationService,
    privacyPolicySettingsService as unknown as PrivacyPolicySettingsService,
    auditMock as unknown as AuditService,
  );
  jest.mocked(ensureAdminAccess).mockResolvedValue(undefined);

  return { service, privacyPolicySettingsService, auditMock, prismaMock };
};

export const createPublicLinkRecordFixture = (overrides: Record<string, unknown> = {}) => ({
  id: 100,
  topicVersion: {
    id: 50,
    topicId: 7,
    versionNumber: 1,
    title: 'Профориентация',
    topic: { archivedAt: null, activePublishedVersion: { id: 50, versionNumber: 1 } },
  },
  educationOrganization: null,
  personalDataProcessingMode: 'PUBLIC',
  operatorFullNameSnapshot: 'АНО «Центр развития компьютерного спорта и цифровых технологий»',
  operatorShortNameSnapshot: null,
  operatorPrivacyPolicyUrlSnapshot: '/privacy',
  operatorConsentDocumentUrlSnapshot: null,
  shortCode: 'DEMO2026',
  isActive: true,
  archivedAt: null,
  startsAt: null,
  endsAt: null,
  entryProfileMode: 'EDUCATION',
  publicTemplate: 'STANDARD',
  publicBranding: null,
  maxAttemptsPerStudent: 3,
  timeLimitMinutes: null,
  allowResume: true,
  consentVersion: 'v1',
  consentTextSnapshot: 'Согласие',
  updatedAt: new Date('2026-05-14T10:00:00.000Z'),
  createdAt: new Date('2026-05-14T10:00:00.000Z'),
  ...overrides,
});

export const createExistingPublicLinkUpdateFixture = (overrides: Record<string, unknown> = {}) => ({
  id: 100,
  archivedAt: null,
  shortCode: 'DEMO2026',
  isActive: true,
  publicTemplate: 'STANDARD',
  timeLimitMinutes: null,
  allowResume: true,
  consentVersion: 'v1',
  consentTextSnapshot: 'Согласие',
  publicBranding: null,
  topicVersion: { versionNumber: 1 },
  entryProfileMode: 'EDUCATION',
  maxAttemptsPerStudent: 3,
  startsAt: null,
  endsAt: null,
  educationOrganizationId: null,
  personalDataProcessingMode: 'PUBLIC',
  operatorFullNameSnapshot: 'АНО «Центр развития компьютерного спорта и цифровых технологий»',
  operatorShortNameSnapshot: null,
  operatorPrivacyPolicyUrlSnapshot: '/privacy',
  operatorConsentDocumentUrlSnapshot: null,
  ...overrides,
});
