import { PrismaService } from '../prisma.service';
import { TestsAdminAttemptService } from './tests-admin-attempt.service';
import { TestsAnalysisService } from './tests-analysis.service';

type PrismaMock = {
  user: {
    findUnique: jest.Mock;
  };
  testPublicLink: {
    findUnique: jest.Mock;
  };
  testStudentAttempt: {
    count: jest.Mock;
    findMany: jest.Mock;
  };
};

describe('TestsAdminAttemptService', () => {
  let service: TestsAdminAttemptService;
  let prismaMock: PrismaMock;
  let analysisServiceMock: {
    toAttemptStatus: jest.Mock;
  };

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
      },
      testPublicLink: {
        findUnique: jest.fn(),
      },
      testStudentAttempt: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };
    analysisServiceMock = {
      toAttemptStatus: jest.fn(() => 'COMPLETED'),
    };

    service = new TestsAdminAttemptService(
      prismaMock as unknown as PrismaService,
      analysisServiceMock as unknown as TestsAnalysisService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated public link attempts', async () => {
    const startedAt = new Date('2026-01-01T10:00:00.000Z');
    const finishedAt = new Date('2026-01-01T10:30:00.000Z');
    const expiresAt = new Date('2026-01-01T11:00:00.000Z');

    prismaMock.user.findUnique.mockResolvedValue({ id: 7, role: 'ADMIN' });
    prismaMock.testPublicLink.findUnique.mockResolvedValue({ id: 13 });
    prismaMock.testStudentAttempt.count.mockResolvedValue(23);
    prismaMock.testStudentAttempt.findMany.mockResolvedValue([
      {
        id: 101,
        status: 'COMPLETED',
        attemptNumber: 21,
        studentName: 'Иван',
        studentLastInitial: 'П',
        studentMiddleInitial: 'С',
        educationOrganization: 'Лицей',
        groupOrClass: '10А',
        startedAt,
        finishedAt,
        expiresAt,
        analysis: {
          status: 'READY',
        },
      },
    ]);

    const response = await service.listAttemptsForLink(7, 13, { page: 3, limit: 10 });

    expect(prismaMock.testStudentAttempt.count).toHaveBeenCalledWith({
      where: { publicLinkId: 13 },
    });
    expect(prismaMock.testStudentAttempt.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { publicLinkId: 13 },
        skip: 20,
        take: 10,
      }),
    );
    expect(response).toEqual({
      page: 3,
      limit: 10,
      total: 23,
      totalPages: 3,
      attempts: [
        {
          attemptId: 101,
          attemptNumber: 21,
          status: 'COMPLETED',
          studentName: 'Иван',
          studentLastInitial: 'П',
          studentMiddleInitial: 'С',
          educationOrganization: 'Лицей',
          groupOrClass: '10А',
          startedAt: startedAt.toISOString(),
          finishedAt: finishedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
          analysisStatus: 'READY',
        },
      ],
    });
  });
});
