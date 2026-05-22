import { BadRequestException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
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
  let service: TestsPublicLinkService;
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

    service = new TestsPublicLinkService(
      prismaMock as unknown as PrismaService,
      educationOrganizationService,
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

  it('updatePublicLink keeps DEMOGRAPHIC links limited to one allowed attempt', async () => {
    prismaMock.testPublicLink.findUnique.mockResolvedValue({
      id: 100,
      archivedAt: null,
      entryProfileMode: 'EDUCATION',
      maxAttemptsPerStudent: 3,
      startsAt: null,
      endsAt: null,
    });
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

  it('updatePublicLink rejects a partial startsAt update that would invert the stored date window', async () => {
    prismaMock.testPublicLink.findUnique.mockResolvedValue({
      id: 100,
      archivedAt: null,
      entryProfileMode: 'EDUCATION',
      maxAttemptsPerStudent: 3,
      startsAt: new Date('2026-05-20T10:00:00.000Z'),
      endsAt: new Date('2026-05-21T10:00:00.000Z'),
    });
    prismaMock.testPublicLink.update.mockResolvedValue(createPublicLinkRecordFixture());

    await expect(
      service.updatePublicLink(7, 100, {
        startsAt: '2026-05-22T10:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.testPublicLink.update).not.toHaveBeenCalled();
  });

  it('updatePublicLink rejects a partial endsAt update that would invert the stored date window', async () => {
    prismaMock.testPublicLink.findUnique.mockResolvedValue({
      id: 100,
      archivedAt: null,
      entryProfileMode: 'EDUCATION',
      maxAttemptsPerStudent: 3,
      startsAt: new Date('2026-05-20T10:00:00.000Z'),
      endsAt: new Date('2026-05-21T10:00:00.000Z'),
    });
    prismaMock.testPublicLink.update.mockResolvedValue(createPublicLinkRecordFixture());

    await expect(
      service.updatePublicLink(7, 100, {
        endsAt: '2026-05-19T10:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.testPublicLink.update).not.toHaveBeenCalled();
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
  shortCode: 'DEMO2026',
  isActive: true,
  archivedAt: null,
  startsAt: null,
  endsAt: null,
  entryProfileMode: 'EDUCATION',
  publicTemplate: 'STANDARD',
  maxAttemptsPerStudent: 3,
  timeLimitMinutes: null,
  allowResume: true,
  consentVersion: 'v1',
  consentTextSnapshot: 'Согласие',
  updatedAt: new Date('2026-05-14T10:00:00.000Z'),
  createdAt: new Date('2026-05-14T10:00:00.000Z'),
  ...overrides,
});
