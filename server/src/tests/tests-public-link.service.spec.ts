import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service';
import { PrivacyPolicySettingsService } from '../app-settings/privacy-policy-settings.service';
import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { TestsEducationOrganizationService } from './tests-education-organization.service';
import { TestsPublicLinkService } from './tests-public-link.service';
import { createEducationOrganizationRecordFixture } from './tests.spec-fixtures';

import type {
  AdminCreateEducationOrganizationDto,
  AdminCreatePublicLinkDto,
  AdminUpdateEducationOrganizationDto,
  AdminUpdatePublicLinkDto,
} from './dto/tests-links.dto';

jest.mock('../common/authz/admin-access.utils', () => ({
  ensureAdminAccess: jest.fn().mockResolvedValue(undefined),
}));

type PrismaEducationOrganizationDelegate = {
  findFirst: jest.Mock;
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
};

type PublicLinkMutationInput = {
  data: Record<string, unknown>;
  [key: string]: unknown;
};

type PrismaTestPublicLinkDelegate = {
  create: jest.Mock<Promise<unknown>, [PublicLinkMutationInput]>;
  findMany: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock<Promise<unknown>, [PublicLinkMutationInput]>;
};

type PrismaTestTopicVersionDelegate = {
  findUnique: jest.Mock;
};

describe('TestsPublicLinkService', () => {
  const publicBranding = {
    version: 1,
    buttons: { primaryColor: '#0066cc', textColor: '#ffffff' },
    accents: { accentColor: '#00a889' },
  };
  let service: TestsPublicLinkService;
  let privacyPolicySettingsService: {
    getPlatformOperatorFullName: jest.Mock;
  };
  let prismaMock: {
    educationOrganization: PrismaEducationOrganizationDelegate;
    testPublicLink: PrismaTestPublicLinkDelegate;
    testTopicVersion: PrismaTestTopicVersionDelegate;
  };

  beforeEach(() => {
    prismaMock = {
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
    privacyPolicySettingsService = {
      getPlatformOperatorFullName: jest.fn().mockResolvedValue('ООО «Новый оператор»'),
    };

    service = new TestsPublicLinkService(
      prismaMock as unknown as PrismaService,
      educationOrganizationService,
      privacyPolicySettingsService as unknown as PrivacyPolicySettingsService,
    );
    jest.mocked(ensureAdminAccess).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('createEducationOrganization rejects missing pattern for STRICT mode', async () => {
    prismaMock.educationOrganization.findFirst.mockResolvedValue(null);

    const dto: AdminCreateEducationOrganizationDto = {
      name: 'Лицей 99',
      groupValidationMode: 'STRICT',
      groupValidationPattern: null,
      groupValidationExample: null,
      groupValidationHint: null,
    };

    await expect(service.createEducationOrganization(7, dto)).rejects.toThrow(BadRequestException);
    expect(prismaMock.educationOrganization.create).not.toHaveBeenCalled();
  });

  it('createEducationOrganization normalizes validation fields for NONE mode', async () => {
    prismaMock.educationOrganization.findFirst.mockResolvedValue(null);
    prismaMock.educationOrganization.create.mockResolvedValue(
      createEducationOrganizationRecordFixture({
        id: 10,
        name: 'Колледж 10',
        groupValidationMode: 'NONE',
      }),
    );
    prismaMock.testPublicLink.findMany.mockResolvedValue([]);

    const dto: AdminCreateEducationOrganizationDto = {
      name: '  Колледж 10  ',
      groupValidationMode: 'NONE',
      groupValidationPattern: ' ^[A-Z]+$ ',
      groupValidationExample: 'EX-1',
      groupValidationHint: 'hint',
    };

    const result = await service.createEducationOrganization(11, dto);

    expect(prismaMock.educationOrganization.create).toHaveBeenCalledWith({
      data: {
        name: 'Колледж 10',
        fullName: null,
        shortName: null,
        inn: null,
        ogrn: null,
        legalAddress: null,
        email: null,
        phone: null,
        privacyPolicyUrl: null,
        consentDocumentUrl: null,
        logoUrl: null,
        groupValidationMode: 'NONE',
        groupValidationPattern: null,
        groupValidationExample: null,
        groupValidationHint: null,
      },
    });
    expect(result.groupValidationPattern).toBeNull();
    expect(result.linksCount).toBe(0);
  });

  it('updateEducationOrganization throws NotFoundException when organization does not exist', async () => {
    prismaMock.educationOrganization.findUnique.mockResolvedValue(null);

    const dto: AdminUpdateEducationOrganizationDto = {
      groupValidationMode: 'HINT',
      groupValidationPattern: '^[A-Z]+$',
      groupValidationExample: null,
      groupValidationHint: null,
    };

    await expect(service.updateEducationOrganization(5, 404, dto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updateEducationOrganization trims and persists provided validation config', async () => {
    prismaMock.educationOrganization.findUnique.mockResolvedValue(
      createEducationOrganizationRecordFixture({
        id: 3,
        name: 'Лицей 3',
        groupValidationMode: 'NONE',
      }),
    );
    prismaMock.educationOrganization.update.mockResolvedValue(
      createEducationOrganizationRecordFixture({
        id: 3,
        name: 'Лицей 3',
        groupValidationMode: 'HINT',
        groupValidationPattern: '^[А-ЯA-Z]{2,4}-?\\d{1,3}[А-ЯA-Z]?$',
        groupValidationExample: 'ИС-21',
        groupValidationHint: 'Укажите формат ИС-21',
      }),
    );
    prismaMock.testPublicLink.findMany.mockResolvedValue([]);

    const dto: AdminUpdateEducationOrganizationDto = {
      groupValidationMode: 'HINT',
      groupValidationPattern: '  ^[А-ЯA-Z]{2,4}-?\\d{1,3}[А-ЯA-Z]?$  ',
      groupValidationExample: '  ИС-21  ',
      groupValidationHint: '  Укажите формат ИС-21  ',
    };

    await service.updateEducationOrganization(9, 3, dto);

    expect(prismaMock.educationOrganization.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: {
        groupValidationMode: 'HINT',
        groupValidationPattern: '^[А-ЯA-Z]{2,4}-?\\d{1,3}[А-ЯA-Z]?$',
        groupValidationExample: 'ИС-21',
        groupValidationHint: 'Укажите формат ИС-21',
      },
    });
  });

  it('createPublicLink stores DEMOGRAPHIC mode with one allowed attempt', async () => {
    prismaMock.testTopicVersion.findUnique.mockResolvedValue({
      id: 50,
      topicId: 7,
      status: 'PUBLISHED',
    });
    prismaMock.testPublicLink.findUnique.mockResolvedValue(null);
    prismaMock.testPublicLink.create.mockResolvedValue(
      createPublicLinkRecordFixture({
        entryProfileMode: 'DEMOGRAPHIC',
        maxAttemptsPerStudent: 1,
      }),
    );

    const dto: AdminCreatePublicLinkDto = {
      publishedVersionId: 50,
      shortCode: 'DEMO2026',
      entryProfileMode: 'DEMOGRAPHIC',
      maxAttemptsPerStudent: 5,
      consentVersion: 'v1',
      consentText: 'Согласие',
    };

    const result = await service.createPublicLink(7, dto);

    const createCall = prismaMock.testPublicLink.create.mock.calls[0]?.[0];

    expect(createCall?.data.entryProfileMode).toBe('DEMOGRAPHIC');
    expect(createCall?.data.maxAttemptsPerStudent).toBe(1);
    expect(result.entryProfileMode).toBe('DEMOGRAPHIC');
    expect(result.maxAttemptsPerStudent).toBe(1);
  });

  it('createPublicLink stores POLUS template when requested', async () => {
    prismaMock.testTopicVersion.findUnique.mockResolvedValue({
      id: 50,
      topicId: 7,
      status: 'PUBLISHED',
    });
    prismaMock.testPublicLink.findUnique.mockResolvedValue(null);
    prismaMock.testPublicLink.create.mockResolvedValue(
      createPublicLinkRecordFixture({
        publicTemplate: 'POLUS',
      }),
    );

    const dto: AdminCreatePublicLinkDto = {
      publishedVersionId: 50,
      publicTemplate: 'POLUS',
      consentVersion: 'v1',
      consentText: 'Согласие',
    };

    const result = await service.createPublicLink(7, dto);

    const createCall = prismaMock.testPublicLink.create.mock.calls[0]?.[0];

    expect(createCall?.data.publicTemplate).toBe('POLUS');
    expect(result.publicTemplate).toBe('POLUS');
  });

  it('createPublicLink defaults to STANDARD template', async () => {
    prismaMock.testTopicVersion.findUnique.mockResolvedValue({
      id: 50,
      topicId: 7,
      status: 'PUBLISHED',
    });
    prismaMock.testPublicLink.findUnique.mockResolvedValue(null);
    prismaMock.testPublicLink.create.mockResolvedValue(createPublicLinkRecordFixture());

    const dto: AdminCreatePublicLinkDto = {
      publishedVersionId: 50,
      consentVersion: 'v1',
      consentText: 'Согласие',
    };

    const result = await service.createPublicLink(7, dto);

    const createCall = prismaMock.testPublicLink.create.mock.calls[0]?.[0];

    expect(createCall?.data.publicTemplate).toBe('STANDARD');
    expect(result.publicTemplate).toBe('STANDARD');
  });

  it('createPublicLink stores public branding when provided', async () => {
    prismaMock.testTopicVersion.findUnique.mockResolvedValue({
      id: 50,
      topicId: 7,
      status: 'PUBLISHED',
    });
    prismaMock.testPublicLink.findUnique.mockResolvedValue(null);
    prismaMock.testPublicLink.create.mockResolvedValue(
      createPublicLinkRecordFixture({
        publicBranding,
      }),
    );

    const dto: AdminCreatePublicLinkDto = {
      publishedVersionId: 50,
      publicBranding,
      consentVersion: 'v1',
      consentText: 'Согласие',
    };

    const result = await service.createPublicLink(7, dto);

    const createCall = prismaMock.testPublicLink.create.mock.calls[0]?.[0];

    expect(createCall?.data.publicBranding).toEqual(publicBranding);
    expect(result.publicBranding).toEqual(publicBranding);
  });

  it('createPublicLink defaults to PUBLIC snapshots while retaining profile organization locking', async () => {
    prismaMock.testTopicVersion.findUnique.mockResolvedValue({
      id: 50,
      topicId: 7,
      status: 'PUBLISHED',
    });
    prismaMock.testPublicLink.findUnique.mockResolvedValue(null);
    prismaMock.educationOrganization.findUnique.mockResolvedValue({ id: 7, isActive: true });
    prismaMock.testPublicLink.create.mockResolvedValue(
      createPublicLinkRecordFixture({ educationOrganization: { id: 7, name: 'Лицей 7' } }),
    );

    await service.createPublicLink(7, {
      publishedVersionId: 50,
      educationOrganizationId: 7,
      consentVersion: 'v1',
      consentText: 'Согласие',
    });

    expect(prismaMock.testPublicLink.create.mock.calls[0]?.[0].data).toEqual(
      expect.objectContaining({
        educationOrganizationId: 7,
        personalDataProcessingMode: 'PUBLIC',
        operatorFullNameSnapshot: 'ООО «Новый оператор»',
        operatorShortNameSnapshot: null,
        operatorPrivacyPolicyUrlSnapshot: '/privacy',
        operatorConsentDocumentUrlSnapshot: null,
      }),
    );
  });

  it('createPublicLink stores and maps an immutable on-behalf operator snapshot', async () => {
    prismaMock.testTopicVersion.findUnique.mockResolvedValue({
      id: 50,
      topicId: 7,
      status: 'PUBLISHED',
    });
    prismaMock.testPublicLink.findUnique.mockResolvedValue(null);
    prismaMock.educationOrganization.findUnique.mockResolvedValue({
      id: 7,
      isActive: true,
      fullName: '  ГБОУ Полное  ',
      shortName: '  ГБОУ  ',
      privacyPolicyUrl: '  https://school.example/privacy  ',
      consentDocumentUrl: null,
      logoUrl: null,
    });
    prismaMock.testPublicLink.create.mockResolvedValue(
      createPublicLinkRecordFixture({
        educationOrganization: { id: 7, name: 'ГБОУ' },
        personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
        operatorFullNameSnapshot: 'ГБОУ Полное',
        operatorShortNameSnapshot: 'ГБОУ',
        operatorPrivacyPolicyUrlSnapshot: 'https://school.example/privacy',
        operatorConsentDocumentUrlSnapshot: null,
      }),
    );

    const result = await service.createPublicLink(7, {
      publishedVersionId: 50,
      educationOrganizationId: 7,
      personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
      consentVersion: 'v1',
      consentText: 'Согласие',
    });

    expect(prismaMock.testPublicLink.create.mock.calls[0]?.[0].data).toEqual(
      expect.objectContaining({
        educationOrganizationId: 7,
        personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
        operatorFullNameSnapshot: 'ГБОУ Полное',
        operatorShortNameSnapshot: 'ГБОУ',
        operatorPrivacyPolicyUrlSnapshot: 'https://school.example/privacy',
        operatorConsentDocumentUrlSnapshot: null,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
        operatorFullNameSnapshot: 'ГБОУ Полное',
      }),
    );
  });

  it('createPublicLink rejects an incomplete on-behalf operator', async () => {
    prismaMock.testTopicVersion.findUnique.mockResolvedValue({
      id: 50,
      topicId: 7,
      status: 'PUBLISHED',
    });
    prismaMock.testPublicLink.findUnique.mockResolvedValue(null);
    prismaMock.educationOrganization.findUnique.mockResolvedValue({
      id: 7,
      isActive: true,
      fullName: 'ГБОУ Полное',
      shortName: 'ГБОУ',
      privacyPolicyUrl: null,
      consentDocumentUrl: null,
      logoUrl: null,
    });

    await expect(
      service.createPublicLink(7, {
        publishedVersionId: 50,
        educationOrganizationId: 7,
        personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
        consentVersion: 'v1',
        consentText: 'Согласие',
      }),
    ).rejects.toThrow('Политику обработки ПДн');
    expect(prismaMock.testPublicLink.create).not.toHaveBeenCalled();
  });

  it('createPublicLink rejects an inverted date window', async () => {
    prismaMock.testTopicVersion.findUnique.mockResolvedValue({
      id: 50,
      topicId: 7,
      status: 'PUBLISHED',
    });
    prismaMock.testPublicLink.findUnique.mockResolvedValue(null);
    prismaMock.testPublicLink.create.mockResolvedValue(createPublicLinkRecordFixture());

    await expect(
      service.createPublicLink(7, {
        publishedVersionId: 50,
        shortCode: 'DATE2026',
        startsAt: '2026-05-22T10:00:00.000Z',
        endsAt: '2026-05-21T10:00:00.000Z',
        consentVersion: 'v1',
        consentText: 'Согласие',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.testPublicLink.create).not.toHaveBeenCalled();
  });

  it('createPublicLink rejects invalid date values before persisting', async () => {
    prismaMock.testTopicVersion.findUnique.mockResolvedValue({
      id: 50,
      topicId: 7,
      status: 'PUBLISHED',
    });
    prismaMock.testPublicLink.findUnique.mockResolvedValue(null);
    prismaMock.testPublicLink.create.mockResolvedValue(createPublicLinkRecordFixture());

    await expect(
      service.createPublicLink(7, {
        publishedVersionId: 50,
        shortCode: 'BADDATE',
        startsAt: 'not-a-date',
        consentVersion: 'v1',
        consentText: 'Согласие',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.testPublicLink.create).not.toHaveBeenCalled();
  });

  it('updatePublicLink resets public branding when null is provided', async () => {
    prismaMock.testPublicLink.findUnique.mockResolvedValue(createExistingPublicLinkUpdateFixture());
    prismaMock.testPublicLink.update.mockResolvedValue(
      createPublicLinkRecordFixture({
        publicBranding: null,
      }),
    );

    const dto: AdminUpdatePublicLinkDto = {
      publicBranding: null,
    };

    const result = await service.updatePublicLink(7, 100, dto);

    const updateCall = prismaMock.testPublicLink.update.mock.calls[0]?.[0];

    expect(updateCall?.data.publicBranding).toBe(Prisma.DbNull);
    expect(result.publicBranding).toBeNull();
  });

  it('updatePublicLink keeps DEMOGRAPHIC links limited to one allowed attempt', async () => {
    prismaMock.testPublicLink.findUnique.mockResolvedValue(createExistingPublicLinkUpdateFixture());
    prismaMock.testPublicLink.update.mockResolvedValue(
      createPublicLinkRecordFixture({
        entryProfileMode: 'DEMOGRAPHIC',
        maxAttemptsPerStudent: 1,
      }),
    );

    const dto: AdminUpdatePublicLinkDto = {
      entryProfileMode: 'DEMOGRAPHIC',
      maxAttemptsPerStudent: 4,
    };

    const result = await service.updatePublicLink(7, 100, dto);

    const updateCall = prismaMock.testPublicLink.update.mock.calls[0]?.[0];

    expect(updateCall?.data.entryProfileMode).toBe('DEMOGRAPHIC');
    expect(updateCall?.data.maxAttemptsPerStudent).toBe(1);
    expect(result.entryProfileMode).toBe('DEMOGRAPHIC');
    expect(result.maxAttemptsPerStudent).toBe(1);
  });

  it('updatePublicLink preserves operator snapshots for unrelated changes', async () => {
    prismaMock.testPublicLink.findUnique.mockResolvedValue(
      createExistingPublicLinkUpdateFixture({
        personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
        educationOrganizationId: 7,
        operatorFullNameSnapshot: 'Историческое полное имя',
        operatorShortNameSnapshot: 'Историческое имя',
        operatorPrivacyPolicyUrlSnapshot: 'https://old.example/privacy',
        operatorConsentDocumentUrlSnapshot: 'https://old.example/consent',
      }),
    );
    prismaMock.testPublicLink.update.mockResolvedValue(
      createPublicLinkRecordFixture({ isActive: false }),
    );

    await service.updatePublicLink(7, 100, { isActive: false });

    const data = prismaMock.testPublicLink.update.mock.calls[0]?.[0].data;
    expect(data).not.toHaveProperty('operatorFullNameSnapshot');
    expect(data).not.toHaveProperty('operatorShortNameSnapshot');
    expect(data).not.toHaveProperty('operatorPrivacyPolicyUrlSnapshot');
    expect(data).not.toHaveProperty('operatorConsentDocumentUrlSnapshot');
    expect(prismaMock.educationOrganization.findUnique).not.toHaveBeenCalled();
  });

  it('updatePublicLink switches to PUBLIC and refreshes platform snapshots', async () => {
    prismaMock.testPublicLink.findUnique.mockResolvedValue(
      createExistingPublicLinkUpdateFixture({
        personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
        educationOrganizationId: 7,
        operatorFullNameSnapshot: 'ГБОУ Полное',
        operatorShortNameSnapshot: 'ГБОУ',
        operatorPrivacyPolicyUrlSnapshot: 'https://school.example/privacy',
      }),
    );
    prismaMock.testPublicLink.update.mockResolvedValue(createPublicLinkRecordFixture());

    await service.updatePublicLink(7, 100, { personalDataProcessingMode: 'PUBLIC' });

    expect(prismaMock.testPublicLink.update.mock.calls[0]?.[0].data).toEqual(
      expect.objectContaining({
        personalDataProcessingMode: 'PUBLIC',
        operatorFullNameSnapshot: 'ООО «Новый оператор»',
        operatorShortNameSnapshot: null,
        operatorPrivacyPolicyUrlSnapshot: '/privacy',
        operatorConsentDocumentUrlSnapshot: null,
      }),
    );
    expect(prismaMock.educationOrganization.findUnique).not.toHaveBeenCalled();
  });

  it('updatePublicLink refreshes on-behalf snapshots when the organization changes', async () => {
    prismaMock.testPublicLink.findUnique.mockResolvedValue(
      createExistingPublicLinkUpdateFixture({
        personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
        educationOrganizationId: 7,
      }),
    );
    prismaMock.educationOrganization.findUnique.mockResolvedValue({
      id: 8,
      isActive: true,
      fullName: 'Новое полное имя',
      shortName: 'Новое имя',
      privacyPolicyUrl: 'https://new.example/privacy',
      consentDocumentUrl: 'https://new.example/consent',
      logoUrl: null,
    });
    prismaMock.testPublicLink.update.mockResolvedValue(
      createPublicLinkRecordFixture({
        personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
      }),
    );

    await service.updatePublicLink(7, 100, { educationOrganizationId: 8 });

    expect(prismaMock.testPublicLink.update.mock.calls[0]?.[0].data).toEqual(
      expect.objectContaining({
        educationOrganizationId: 8,
        operatorFullNameSnapshot: 'Новое полное имя',
        operatorShortNameSnapshot: 'Новое имя',
        operatorPrivacyPolicyUrlSnapshot: 'https://new.example/privacy',
        operatorConsentDocumentUrlSnapshot: 'https://new.example/consent',
      }),
    );
  });

  it('updatePublicLink rejects a partial startsAt update that would invert the stored date window', async () => {
    prismaMock.testPublicLink.findUnique.mockResolvedValue(
      createExistingPublicLinkUpdateFixture({
        startsAt: new Date('2026-05-20T10:00:00.000Z'),
        endsAt: new Date('2026-05-21T10:00:00.000Z'),
      }),
    );
    prismaMock.testPublicLink.update.mockResolvedValue(createPublicLinkRecordFixture());

    await expect(
      service.updatePublicLink(7, 100, {
        startsAt: '2026-05-22T10:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.testPublicLink.update).not.toHaveBeenCalled();
  });

  it('updatePublicLink rejects a partial endsAt update that would invert the stored date window', async () => {
    prismaMock.testPublicLink.findUnique.mockResolvedValue(
      createExistingPublicLinkUpdateFixture({
        startsAt: new Date('2026-05-20T10:00:00.000Z'),
        endsAt: new Date('2026-05-21T10:00:00.000Z'),
      }),
    );
    prismaMock.testPublicLink.update.mockResolvedValue(createPublicLinkRecordFixture());

    await expect(
      service.updatePublicLink(7, 100, {
        endsAt: '2026-05-19T10:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.testPublicLink.update).not.toHaveBeenCalled();
  });

  it('getPublicLinkAccessByCode exposes stored on-behalf snapshots and only the live logo', async () => {
    prismaMock.testPublicLink.findUnique.mockResolvedValue(
      createPublicLinkRecordFixture({
        personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
        operatorFullNameSnapshot: 'Историческое полное имя школы',
        operatorShortNameSnapshot: 'Историческое имя',
        operatorPrivacyPolicyUrlSnapshot: 'https://old.example/privacy',
        operatorConsentDocumentUrlSnapshot: 'https://old.example/consent',
        educationOrganization: {
          id: 42,
          name: 'Новое название школы',
          fullName: 'Новое полное имя школы',
          shortName: 'Новое имя',
          privacyPolicyUrl: 'https://new.example/privacy',
          consentDocumentUrl: 'https://new.example/consent',
          logoUrl: 'https://new.example/logo.svg',
          inn: '1234567890',
          ogrn: '1234567890123',
          legalAddress: 'Секретный адрес',
          email: 'private@example.com',
          phone: '+70000000000',
          isActive: true,
          groupValidationMode: 'NONE',
          groupValidationPattern: null,
          groupValidationExample: null,
          groupValidationHint: null,
        },
        topicVersion: {
          id: 50,
          topicId: 7,
          title: 'Профориентация',
          description: null,
          status: 'PUBLISHED',
          _count: { questions: 1 },
        },
      }),
    );

    const result = await service.getPublicLinkAccessByCode('demo2026');

    expect(result.personalData).toEqual({
      processingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
      operatorFullName: 'Историческое полное имя школы',
      operatorShortName: 'Историческое имя',
      privacyPolicyUrl: 'https://old.example/privacy',
      consentDocumentUrl: 'https://old.example/consent',
      logoUrl: 'https://new.example/logo.svg',
    });
    expect(result).not.toHaveProperty('inn');
    expect(result).not.toHaveProperty('ogrn');
    expect(result).not.toHaveProperty('legalAddress');
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('phone');
  });

  it('getPublicLinkAccessByCode applies exact platform fallbacks for a legacy PUBLIC link', async () => {
    prismaMock.testPublicLink.findUnique.mockResolvedValue(
      createPublicLinkRecordFixture({
        operatorFullNameSnapshot: null,
        operatorPrivacyPolicyUrlSnapshot: null,
        educationOrganization: {
          id: 42,
          name: 'Лицей 42',
          logoUrl: 'https://school.example/logo.svg',
          isActive: true,
          groupValidationMode: 'NONE',
          groupValidationPattern: null,
          groupValidationExample: null,
          groupValidationHint: null,
        },
        topicVersion: {
          id: 50,
          topicId: 7,
          title: 'Профориентация',
          description: null,
          status: 'PUBLISHED',
          _count: { questions: 1 },
        },
      }),
    );

    const result = await service.getPublicLinkAccessByCode('demo2026');

    expect(result.personalData).toEqual({
      processingMode: 'PUBLIC',
      operatorFullName: 'АНО «Центр развития компьютерного спорта и цифровых технологий»',
      operatorShortName: null,
      privacyPolicyUrl: '/privacy',
      consentDocumentUrl: null,
      logoUrl: null,
    });
  });

  it('getAccessiblePublicLinkByCode allows immutable archived published snapshots', async () => {
    prismaMock.testPublicLink.findUnique.mockResolvedValue(
      createPublicLinkRecordFixture({
        topicVersion: {
          id: 50,
          topicId: 7,
          title: 'Профориентация',
          description: null,
          status: 'ARCHIVED',
          _count: { questions: 1 },
        },
      }),
    );

    await expect(service.getAccessiblePublicLinkByCode('demo2026')).resolves.toMatchObject({
      shortCode: 'DEMO2026',
      topicVersion: {
        id: 50,
        status: 'ARCHIVED',
      },
    });
  });

  it('getAccessiblePublicLinkByCode rejects links pointing to draft versions', async () => {
    prismaMock.testPublicLink.findUnique.mockResolvedValue(
      createPublicLinkRecordFixture({
        topicVersion: {
          id: 50,
          topicId: 7,
          title: 'Профориентация',
          description: null,
          status: 'DRAFT',
          _count: { questions: 1 },
        },
      }),
    );

    await expect(service.getAccessiblePublicLinkByCode('demo2026')).rejects.toThrow(
      BadRequestException,
    );
  });
});

const createPublicLinkRecordFixture = (overrides: Record<string, unknown> = {}) => ({
  id: 100,
  topicVersion: {
    id: 50,
    topicId: 7,
    title: 'Профориентация',
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

const createExistingPublicLinkUpdateFixture = (overrides: Record<string, unknown> = {}) => ({
  id: 100,
  archivedAt: null,
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
