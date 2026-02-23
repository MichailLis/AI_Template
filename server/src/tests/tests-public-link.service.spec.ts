import { BadRequestException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { ensureTestsAdminAccess } from './tests-admin-access.utils';
import { TestsEducationOrganizationService } from './tests-education-organization.service';
import { TestsPublicLinkService } from './tests-public-link.service';
import { createEducationOrganizationRecordFixture } from './tests.spec-fixtures';

import type {
  AdminCreateEducationOrganizationDto,
  AdminUpdateEducationOrganizationDto,
} from './dto/tests-links.dto';

jest.mock('./tests-admin-access.utils', () => ({
  ensureTestsAdminAccess: jest.fn().mockResolvedValue(undefined),
}));

type PrismaEducationOrganizationDelegate = {
  findFirst: jest.Mock;
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
};

type PrismaTestPublicLinkDelegate = {
  findMany: jest.Mock;
};

describe('TestsPublicLinkService', () => {
  let service: TestsPublicLinkService;
  let prismaMock: {
    educationOrganization: PrismaEducationOrganizationDelegate;
    testPublicLink: PrismaTestPublicLinkDelegate;
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
        findMany: jest.fn(),
      },
    };

    const educationOrganizationService = new TestsEducationOrganizationService(
      prismaMock as unknown as PrismaService,
    );

    service = new TestsPublicLinkService(
      prismaMock as unknown as PrismaService,
      educationOrganizationService,
    );
    jest.mocked(ensureTestsAdminAccess).mockResolvedValue(undefined);
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
});
