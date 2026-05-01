import { PrismaService } from '../prisma.service';
import { ensureTestsAdminAccess } from './tests-admin-access.utils';
import { TestsEducationOrganizationService } from './tests-education-organization.service';
import { createEducationOrganizationRecordFixture } from './tests.spec-fixtures';

jest.mock('./tests-admin-access.utils', () => ({
  ensureTestsAdminAccess: jest.fn().mockResolvedValue(undefined),
}));

type PrismaMock = {
  educationOrganization: {
    count: jest.Mock;
    findMany: jest.Mock;
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
        findMany: jest.fn(),
      },
      testPublicLink: {
        findMany: jest.fn(),
      },
    };

    service = new TestsEducationOrganizationService(prismaMock as unknown as PrismaService);
    jest.mocked(ensureTestsAdminAccess).mockResolvedValue(undefined);
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

    expect(ensureTestsAdminAccess).toHaveBeenCalledWith(prismaMock, 7);
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
});
