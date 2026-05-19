import { ProfessionAtlasSettingsService } from '../app-settings/profession-atlas-settings.service';
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
    findUnique: jest.Mock;
  };
};

describe('TestsAdminAttemptService', () => {
  let service: TestsAdminAttemptService;
  let prismaMock: PrismaMock;
  let analysisServiceMock: {
    toAttemptStatus: jest.Mock;
  };
  let professionAtlasSettingsServiceMock: {
    getProfessionAtlasUrl: jest.Mock;
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
        findUnique: jest.fn(),
      },
    };
    analysisServiceMock = {
      toAttemptStatus: jest.fn(() => 'COMPLETED'),
    };
    professionAtlasSettingsServiceMock = {
      getProfessionAtlasUrl: jest.fn().mockResolvedValue(null),
    };

    service = new TestsAdminAttemptService(
      prismaMock as unknown as PrismaService,
      analysisServiceMock as unknown as TestsAnalysisService,
      professionAtlasSettingsServiceMock as unknown as ProfessionAtlasSettingsService,
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
        studentGender: null,
        studentAge: null,
        studentResidence: null,
        studentEducationLevel: null,
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
          entryProfileMode: 'EDUCATION',
          studentName: 'Иван',
          studentLastInitial: 'П',
          studentMiddleInitial: 'С',
          educationOrganization: 'Лицей',
          groupOrClass: '10А',
          studentGender: null,
          studentAge: null,
          studentResidence: null,
          studentEducationLevel: null,
          startedAt: startedAt.toISOString(),
          finishedAt: finishedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
          analysisStatus: 'READY',
        },
      ],
    });
  });

  it('returns demographic profile fields in attempt detail', async () => {
    const startedAt = new Date('2026-01-02T10:00:00.000Z');
    const consentAcceptedAt = new Date('2026-01-02T09:59:00.000Z');

    prismaMock.user.findUnique.mockResolvedValue({ id: 7, role: 'ADMIN' });
    prismaMock.testStudentAttempt.findUnique.mockResolvedValue({
      id: 202,
      status: 'COMPLETED',
      publicLink: {
        id: 13,
        shortCode: 'DEMO2026',
      },
      attemptNumber: 1,
      studentName: null,
      studentLastInitial: null,
      studentMiddleInitial: null,
      educationOrganization: null,
      groupOrClass: null,
      studentGender: 'FEMALE',
      studentAge: 17,
      studentResidence: 'Казань',
      studentEducationLevel: 'SECONDARY_GENERAL',
      consentAcceptedAt,
      consentVersion: 'v1',
      startedAt,
      finishedAt: null,
      expiresAt: null,
      answers: [],
      analysis: null,
    });
    professionAtlasSettingsServiceMock.getProfessionAtlasUrl.mockResolvedValue(
      'https://atlas.example/professions',
    );

    const response = await service.getAttemptDetail(7, 202);

    expect(response).toMatchObject({
      attemptId: 202,
      professionAtlasUrl: 'https://atlas.example/professions',
      entryProfileMode: 'DEMOGRAPHIC',
      studentName: null,
      studentLastInitial: null,
      studentMiddleInitial: null,
      educationOrganization: null,
      groupOrClass: null,
      studentGender: 'FEMALE',
      studentAge: 17,
      studentResidence: 'Казань',
      studentEducationLevel: 'SECONDARY_GENERAL',
    });
  });

  it('marks attempts with education and demographic fields as EDUCATION_DEMOGRAPHIC', async () => {
    const startedAt = new Date('2026-01-03T10:00:00.000Z');

    prismaMock.user.findUnique.mockResolvedValue({ id: 7, role: 'ADMIN' });
    prismaMock.testPublicLink.findUnique.mockResolvedValue({ id: 13 });
    prismaMock.testStudentAttempt.count.mockResolvedValue(1);
    prismaMock.testStudentAttempt.findMany.mockResolvedValue([
      {
        id: 303,
        status: 'COMPLETED',
        attemptNumber: 1,
        studentName: 'Иван',
        studentLastInitial: null,
        studentMiddleInitial: null,
        educationOrganization: 'Лицей',
        groupOrClass: '10А',
        studentGender: 'MALE',
        studentAge: 18,
        studentResidence: 'Казань',
        studentEducationLevel: 'SECONDARY_SPECIAL',
        startedAt,
        finishedAt: null,
        expiresAt: null,
        analysis: null,
      },
    ]);

    const response = await service.listAttemptsForLink(7, 13, { page: 1, limit: 10 });

    expect(response.attempts[0]).toMatchObject({
      attemptId: 303,
      entryProfileMode: 'EDUCATION_DEMOGRAPHIC',
      studentName: 'Иван',
      studentGender: 'MALE',
      studentAge: 18,
      studentResidence: 'Казань',
      studentEducationLevel: 'SECONDARY_SPECIAL',
    });
  });

  it('uses the public link entry profile mode for partially filled hybrid attempt rows', async () => {
    const startedAt = new Date('2026-01-04T10:00:00.000Z');

    prismaMock.user.findUnique.mockResolvedValue({ id: 7, role: 'ADMIN' });
    prismaMock.testPublicLink.findUnique.mockResolvedValue({ id: 13 });
    prismaMock.testStudentAttempt.count.mockResolvedValue(1);
    prismaMock.testStudentAttempt.findMany.mockResolvedValue([
      {
        id: 404,
        status: 'COMPLETED',
        attemptNumber: 1,
        publicLink: {
          entryProfileMode: 'EDUCATION_DEMOGRAPHIC',
        },
        studentName: null,
        studentLastInitial: null,
        studentMiddleInitial: null,
        educationOrganization: null,
        groupOrClass: null,
        studentGender: 'FEMALE',
        studentAge: 17,
        studentResidence: 'Казань',
        studentEducationLevel: 'SECONDARY_GENERAL',
        startedAt,
        finishedAt: null,
        expiresAt: null,
        analysis: null,
      },
    ]);

    const response = await service.listAttemptsForLink(7, 13, { page: 1, limit: 10 });

    expect(response.attempts[0]?.entryProfileMode).toBe('EDUCATION_DEMOGRAPHIC');
  });

  it('uses the public link entry profile mode for hybrid attempt details', async () => {
    const startedAt = new Date('2026-01-05T10:00:00.000Z');
    const consentAcceptedAt = new Date('2026-01-05T09:59:00.000Z');

    prismaMock.user.findUnique.mockResolvedValue({ id: 7, role: 'ADMIN' });
    prismaMock.testStudentAttempt.findUnique.mockResolvedValue({
      id: 505,
      status: 'COMPLETED',
      publicLink: {
        id: 13,
        shortCode: 'HYBRID2026',
        entryProfileMode: 'EDUCATION_DEMOGRAPHIC',
      },
      attemptNumber: 1,
      studentName: null,
      studentLastInitial: null,
      studentMiddleInitial: null,
      educationOrganization: null,
      groupOrClass: null,
      studentGender: 'FEMALE',
      studentAge: 17,
      studentResidence: 'Казань',
      studentEducationLevel: 'SECONDARY_GENERAL',
      consentAcceptedAt,
      consentVersion: 'v1',
      startedAt,
      finishedAt: null,
      expiresAt: null,
      answers: [],
      analysis: null,
    });

    const response = await service.getAttemptDetail(7, 505);

    expect(response.entryProfileMode).toBe('EDUCATION_DEMOGRAPHIC');
  });
});
