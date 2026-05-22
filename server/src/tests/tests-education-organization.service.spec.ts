import { BadRequestException } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { TestsEducationOrganizationService } from './tests-education-organization.service';
import { createEducationOrganizationRecordFixture } from './tests.spec-fixtures';

jest.mock('../common/authz/admin-access.utils', () => ({
  ensureAdminAccess: jest.fn().mockResolvedValue(undefined),
}));

type PrismaMock = {
  educationOrganization: {
    count: jest.Mock;
    create: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  testPublicLink: {
    findMany: jest.Mock;
  };
};

describe('TestsEducationOrganizationService', () => {
  let service: TestsEducationOrganizationService;
  let prismaMock: PrismaMock;

  beforeEach(() => {
    prismaMock = {
      educationOrganization: {
        count: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      testPublicLink: {
        findMany: jest.fn(),
      },
    };

    service = new TestsEducationOrganizationService(prismaMock as unknown as PrismaService);
    jest.mocked(ensureAdminAccess).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated education organizations with totals', async () => {
    const firstOrganization = createEducationOrganizationRecordFixture({
      id: 21,
      name: 'Гимназия 21',
    });
    const secondOrganization = createEducationOrganizationRecordFixture({
      id: 22,
      name: 'Лицей 22',
      isActive: false,
    });

    prismaMock.educationOrganization.count.mockResolvedValue(23);
    prismaMock.educationOrganization.findMany.mockResolvedValue([
      firstOrganization,
      secondOrganization,
    ]);
    prismaMock.testPublicLink.findMany.mockResolvedValue([
      {
        educationOrganizationId: 21,
        isActive: true,
        _count: {
          attempts: 4,
        },
      },
      {
        educationOrganizationId: 22,
        isActive: false,
        _count: {
          attempts: 2,
        },
      },
    ]);

    const result = await (
      service.listEducationOrganizations as (
        userId: number,
        query: { page: number; limit: number },
      ) => Promise<unknown>
    )(7, { page: 3, limit: 10 });

    expect(ensureAdminAccess).toHaveBeenCalledWith(prismaMock, 7);
    expect(prismaMock.educationOrganization.count).toHaveBeenCalledWith();
    expect(prismaMock.educationOrganization.findMany).toHaveBeenCalledWith({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      skip: 20,
      take: 10,
    });
    expect(result).toEqual({
      page: 3,
      limit: 10,
      total: 23,
      totalPages: 3,
      organizations: [
        {
          id: 21,
          name: 'Гимназия 21',
          isActive: true,
          groupValidationMode: 'NONE',
          groupValidationPattern: null,
          groupValidationExample: null,
          groupValidationHint: null,
          linksCount: 1,
          activeLinksCount: 1,
          attemptsCount: 4,
          createdAt: firstOrganization.createdAt.toISOString(),
          updatedAt: firstOrganization.updatedAt.toISOString(),
        },
        {
          id: 22,
          name: 'Лицей 22',
          isActive: false,
          groupValidationMode: 'NONE',
          groupValidationPattern: null,
          groupValidationExample: null,
          groupValidationHint: null,
          linksCount: 1,
          activeLinksCount: 0,
          attemptsCount: 2,
          createdAt: secondOrganization.createdAt.toISOString(),
          updatedAt: secondOrganization.updatedAt.toISOString(),
        },
      ],
    });
  });

  it('creates education organizations with trimmed names and case-insensitive duplicate check', async () => {
    const createdOrganization = createEducationOrganizationRecordFixture({
      id: 31,
      name: 'Лицей 42',
    });

    prismaMock.educationOrganization.findFirst.mockResolvedValue(null);
    prismaMock.educationOrganization.create.mockResolvedValue(createdOrganization);
    prismaMock.testPublicLink.findMany.mockResolvedValue([]);

    await (
      service.createEducationOrganization as (
        userId: number,
        dto: { name: string },
      ) => Promise<unknown>
    )(7, { name: '  Лицей 42  ' });

    expect(prismaMock.educationOrganization.findFirst).toHaveBeenCalledWith({
      where: {
        name: {
          equals: 'Лицей 42',
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });
    expect(prismaMock.educationOrganization.create).toHaveBeenCalledWith({
      data: {
        name: 'Лицей 42',
        groupValidationMode: 'NONE',
        groupValidationPattern: null,
        groupValidationExample: null,
        groupValidationHint: null,
      },
    });
  });

  it('rejects education organization duplicates regardless of name case', async () => {
    prismaMock.educationOrganization.findFirst.mockResolvedValue({ id: 31 });

    await expect(
      (
        service.createEducationOrganization as (
          userId: number,
          dto: { name: string },
        ) => Promise<unknown>
      )(7, { name: 'лицей 42' }),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.educationOrganization.create).not.toHaveBeenCalled();
  });

  it('maps database unique races to the same education organization duplicate error', async () => {
    prismaMock.educationOrganization.findFirst.mockResolvedValue(null);
    prismaMock.educationOrganization.create.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['name'] },
    });

    await expect(
      (
        service.createEducationOrganization as (
          userId: number,
          dto: { name: string },
        ) => Promise<unknown>
      )(7, { name: 'Лицей 42' }),
    ).rejects.toThrow('Учебное заведение с таким названием уже существует');
  });
});
