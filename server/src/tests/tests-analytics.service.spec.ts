import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { TestsAnalyticsService } from './tests-analytics.service';
import { PROF_ORIENTATION_DIRECTIONS } from './prof-orientation-v3-plus.types';

jest.mock('../common/authz/admin-access.utils', () => ({
  ensureAdminAccess: jest.fn(),
}));

const createDirectionSummary = (directionId: (typeof PROF_ORIENTATION_DIRECTIONS)[number]) => ({
  id: directionId,
  block: `block-${directionId}`,
  name: `Direction ${directionId}`,
  short: directionId,
  score: 0,
  professions: [],
  resultCard: {
    headline: 'Headline',
    meaning: 'Meaning',
    fitsIf: ['f1'],
    tryActions: ['t1'],
    learn: ['l1'],
    miniProject: 'Project',
  },
});

const createV3Summary = () => ({
  resultKind: 'prof_orientation_v3_plus',
  scoringVersion: '3.0',
  scores: Object.fromEntries(
    PROF_ORIENTATION_DIRECTIONS.map((direction) => [direction, 0]),
  ) as Record<(typeof PROF_ORIENTATION_DIRECTIONS)[number], number>,
  selectedCounts: Object.fromEntries(
    PROF_ORIENTATION_DIRECTIONS.map((direction) => [direction, 0]),
  ) as Record<(typeof PROF_ORIENTATION_DIRECTIONS)[number], number>,
  sliderValues: {},
  topDirections: [
    createDirectionSummary('A1'),
    createDirectionSummary('A2'),
    createDirectionSummary('A3'),
  ],
  primaryDirection: createDirectionSummary('A1'),
  secondaryDirection: createDirectionSummary('A2'),
  profile: {
    type: 'single_profile',
    title: 'Single',
    meaning: 'Profile meaning',
    directions: ['A1'],
    miniProject: null,
  },
  confidence: {
    level: 'high',
    label: 'high',
    gap: 10,
    consistencyIndex: 0.7,
    readinessTop: 5,
  },
  flags: [],
  llm: {
    status: 'not_requested',
  },
});

type PrismaMock = {
  user: {
    findUnique: jest.Mock;
  };
  testTopic: {
    findUnique: jest.Mock;
  };
  testPublicLink: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
  };
  testStudentAttempt: {
    findMany: jest.Mock;
  };
  testTopicVersion: {
    findUnique: jest.Mock;
  };
};

describe('TestsAnalyticsService', () => {
  let service: TestsAnalyticsService;
  let prismaMock: PrismaMock;

  const topicSelect = {
    id: 1,
    slug: 'topic-a',
    archivedAt: null,
    activePublishedVersion: {
      title: 'Тестовая тема',
      createdAt: new Date('2026-05-01T10:00:00.000Z'),
      _count: { questions: 3 },
    },
  };

  const publicLinks = [
    {
      id: 11,
      shortCode: 'ACTIVE-11',
      archivedAt: null,
      topicVersion: { versionNumber: 1, title: 'Версия 1', _count: { questions: 10 } },
    },
    {
      id: 22,
      shortCode: 'ARCHIVED-22',
      archivedAt: new Date('2026-04-01T12:00:00.000Z'),
      topicVersion: { versionNumber: 2, title: 'Версия 2', _count: { questions: 8 } },
    },
  ];
  const publicLinksWithOneArchived = [publicLinks[0], publicLinks[1]];
  const publicLinksActive = [
    publicLinks[0],
    {
      ...publicLinks[1],
      archivedAt: null,
    },
  ];

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
      },
      testTopic: {
        findUnique: jest.fn(),
      },
      testPublicLink: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      testStudentAttempt: {
        findMany: jest.fn(),
      },
      testTopicVersion: {
        findUnique: jest.fn(),
      },
    };

    service = new TestsAnalyticsService(prismaMock as unknown as PrismaService);
    jest.mocked(ensureAdminAccess).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('checks admin access before loading analytics data', async () => {
    const error = new ForbiddenException('Admin area only');
    jest.mocked(ensureAdminAccess).mockRejectedValue(error);

    await expect(
      service.getSummary(7, 1, {
        scope: 'TOPIC',
        linkStatus: 'ALL',
      }),
    ).rejects.toBe(error);

    expect(ensureAdminAccess).toHaveBeenCalledWith(prismaMock, 7);
    expect(prismaMock.testTopic.findUnique).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when topic does not exist', async () => {
    prismaMock.testTopic.findUnique.mockResolvedValue(null);

    await expect(
      service.getSummary(7, 1, {
        scope: 'TOPIC',
        linkStatus: 'ALL',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(ensureAdminAccess).toHaveBeenCalledWith(prismaMock, 7);
    expect(prismaMock.testPublicLink.findMany).not.toHaveBeenCalled();
  });

  it('topic scope includes multiple public links in report', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 7, role: 'ADMIN' });
    prismaMock.testTopic.findUnique.mockResolvedValue(topicSelect);
    prismaMock.testPublicLink.findMany.mockResolvedValue(publicLinksActive);
    prismaMock.testStudentAttempt.findMany.mockResolvedValue([
      {
        id: 101,
        status: 'COMPLETED',
        startedAt: new Date('2026-05-10T10:00:00.000Z'),
        finishedAt: null,
        publicLink: publicLinks[0],
        topicVersion: publicLinks[0].topicVersion,
        analysis: { status: 'READY', summary: createV3Summary() },
        educationOrganization: 'Лицей',
        groupOrClass: '10А',
        studentGender: 'FEMALE',
        studentAge: 16,
        studentResidence: 'Москва',
        studentEducationLevel: 'SECONDARY_GENERAL',
      },
    ]);

    const result = await service.getSummary(7, 1, {
      scope: 'TOPIC',
      linkStatus: 'ACTIVE',
    });

    expect(result.publicLinks).toHaveLength(2);
    expect(result.publicLinks.map((link) => link.publicLinkId)).toEqual([11, 22]);
    expect(ensureAdminAccess).toHaveBeenCalledWith(prismaMock, 7);
    expect(prismaMock.testPublicLink.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          archivedAt: null,
          topicVersion: { topicId: 1 },
        },
      }),
    );
  });

  it('archived links are included when linkStatus is ALL', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 7, role: 'ADMIN' });
    prismaMock.testTopic.findUnique.mockResolvedValue(topicSelect);
    prismaMock.testPublicLink.findMany.mockResolvedValue(publicLinksWithOneArchived);
    prismaMock.testStudentAttempt.findMany.mockResolvedValue([]);

    const result = await service.getSummary(7, 1, {
      scope: 'TOPIC',
      linkStatus: 'ALL',
    });

    expect(result.publicLinks).toHaveLength(2);
    expect(result.coverage.publicLinks).toBe(2);
    expect(result.publicLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          publicLinkId: 22,
          shortCode: 'ARCHIVED-22',
        }),
      ]),
    );
    expect(result.coverage.attemptsTotal).toBe(0);
    expect(result.directions).toEqual([]);
    expect(result.scoreAverages).toEqual([]);
  });

  it('filters only archived links when linkStatus is ARCHIVED', async () => {
    prismaMock.testTopic.findUnique.mockResolvedValue(topicSelect);
    prismaMock.testPublicLink.findMany.mockResolvedValue([publicLinks[1]]);
    prismaMock.testStudentAttempt.findMany.mockResolvedValue([]);

    const result = await service.getSummary(7, 1, {
      scope: 'TOPIC',
      linkStatus: 'ARCHIVED',
    });

    expect(result.publicLinks).toHaveLength(1);
    expect(result.publicLinks[0]).toMatchObject({
      publicLinkId: 22,
      shortCode: 'ARCHIVED-22',
    });
    expect(prismaMock.testPublicLink.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          archivedAt: { not: null },
          topicVersion: { topicId: 1 },
        },
      }),
    );
  });

  it('returns a fully empty report when scope has no public links', async () => {
    prismaMock.testTopic.findUnique.mockResolvedValue(topicSelect);
    prismaMock.testPublicLink.findMany.mockResolvedValue([]);

    const result = await service.getSummary(7, 1, {
      scope: 'TOPIC',
      linkStatus: 'ALL',
    });

    expect(result.coverage).toEqual({
      publicLinks: 0,
      attemptsTotal: 0,
      attemptsCompleted: 0,
      analysisReady: 0,
      analysisPending: 0,
      analysisFailed: 0,
      analysisMissing: 0,
      v3Results: 0,
    });
    expect(result.directions).toEqual([]);
    expect(result.directionPairs).toEqual([]);
    expect(result.scoreAverages).toEqual([]);
    expect(result.profiles).toEqual([]);
    expect(result.confidence.levels).toEqual([]);
    expect(result.flags).toEqual([]);
    expect(result.publicLinks).toEqual([]);
    expect(result.groups).toEqual([]);
    expect(result.demographics).toEqual({
      gender: [],
      ageRange: [],
      residence: [],
      educationLevel: [],
    });
    expect(result.attempts).toEqual([]);
    expect(prismaMock.testStudentAttempt.findMany).not.toHaveBeenCalled();
  });

  it('public link scope returns only selected link', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 7, role: 'ADMIN' });
    prismaMock.testTopic.findUnique.mockResolvedValue(topicSelect);
    prismaMock.testPublicLink.findUnique.mockResolvedValue({
      id: 22,
      topicVersion: { topicId: 1 },
    });
    prismaMock.testPublicLink.findMany.mockResolvedValue([publicLinks[1]]);
    prismaMock.testStudentAttempt.findMany.mockResolvedValue([
      {
        id: 202,
        status: 'COMPLETED',
        startedAt: new Date('2026-05-11T10:00:00.000Z'),
        finishedAt: null,
        publicLink: publicLinks[1],
        topicVersion: publicLinks[1].topicVersion,
        analysis: null,
        educationOrganization: null,
        groupOrClass: null,
        studentGender: null,
        studentAge: null,
        studentResidence: null,
        studentEducationLevel: null,
      },
    ]);

    const result = await service.getSummary(7, 1, {
      scope: 'PUBLIC_LINK',
      publicLinkId: 22,
      linkStatus: 'ALL',
    });

    expect(result.publicLinks).toHaveLength(1);
    expect(result.publicLinks[0]?.publicLinkId).toBe(22);
    expect(prismaMock.testStudentAttempt.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          publicLinkId: { in: [22] },
        },
      }),
    );
  });

  it('missing analysis and invalid summaries affect coverage but not v3 aggregates', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 7, role: 'ADMIN' });
    prismaMock.testTopic.findUnique.mockResolvedValue(topicSelect);
    prismaMock.testPublicLink.findMany.mockResolvedValue([publicLinks[0]]);
    prismaMock.testStudentAttempt.findMany.mockResolvedValue([
      {
        id: 301,
        status: 'COMPLETED',
        startedAt: new Date('2026-05-10T10:00:00.000Z'),
        finishedAt: new Date('2026-05-10T10:10:00.000Z'),
        publicLink: publicLinks[0],
        topicVersion: publicLinks[0].topicVersion,
        analysis: { status: 'READY', summary: createV3Summary() },
        educationOrganization: 'Школа',
        groupOrClass: '11Б',
        studentGender: 'MALE',
        studentAge: 20,
        studentResidence: 'Пермь',
        studentEducationLevel: 'SECONDARY_SPECIAL',
      },
      {
        id: 302,
        status: 'COMPLETED',
        startedAt: new Date('2026-05-10T11:00:00.000Z'),
        finishedAt: null,
        publicLink: publicLinks[0],
        topicVersion: publicLinks[0].topicVersion,
        analysis: { status: 'READY', summary: { resultKind: 'prof_orientation_v3_plus' } },
        educationOrganization: 'Школа',
        groupOrClass: '11Б',
        studentGender: 'MALE',
        studentAge: 18,
        studentResidence: 'Пермь',
        studentEducationLevel: 'SECONDARY_SPECIAL',
      },
      {
        id: 303,
        status: 'IN_PROGRESS',
        startedAt: new Date('2026-05-10T12:00:00.000Z'),
        finishedAt: null,
        publicLink: publicLinks[0],
        topicVersion: publicLinks[0].topicVersion,
        analysis: null,
        educationOrganization: 'Лицей',
        groupOrClass: '11Б',
        studentGender: null,
        studentAge: null,
        studentResidence: null,
        studentEducationLevel: null,
      },
    ]);

    const result = await service.getSummary(7, 1, {
      scope: 'TOPIC',
      linkStatus: 'ALL',
    });

    expect(result.coverage.attemptsTotal).toBe(3);
    expect(result.coverage.analysisMissing).toBe(1);
    expect(result.coverage.v3Results).toBe(1);
    expect(result.scoreAverages).not.toHaveLength(0);
    expect(result.directions).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'A1', count: 1, share: 100 })]),
    );
  });

  it('throws NotFoundException for public link that does not belong to the topic', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 7, role: 'ADMIN' });
    prismaMock.testTopic.findUnique.mockResolvedValue(topicSelect);
    prismaMock.testPublicLink.findUnique.mockResolvedValue({
      id: 22,
      topicVersion: { topicId: 2 },
    });

    await expect(
      service.getSummary(7, 1, {
        scope: 'PUBLIC_LINK',
        publicLinkId: 22,
        linkStatus: 'ALL',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('applies dateFrom/dateTo filters on attempt.startedAt', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 7, role: 'ADMIN' });
    prismaMock.testTopic.findUnique.mockResolvedValue(topicSelect);
    prismaMock.testPublicLink.findMany.mockResolvedValue([publicLinks[0]]);
    prismaMock.testStudentAttempt.findMany.mockResolvedValue([]);

    await service.getSummary(7, 1, {
      scope: 'TOPIC',
      linkStatus: 'ALL',
      dateFrom: '2026-05-10',
      dateTo: '2026-05-12',
    });

    expect(prismaMock.testStudentAttempt.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          publicLinkId: { in: [11] },
          startedAt: {
            gte: new Date('2026-05-10T00:00:00.000Z'),
            lte: new Date('2026-05-12T23:59:59.999Z'),
          },
        },
      }),
    );
  });

  it('loads attempts with required relations/fields', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 7, role: 'ADMIN' });
    prismaMock.testTopic.findUnique.mockResolvedValue(topicSelect);
    prismaMock.testPublicLink.findMany.mockResolvedValue([publicLinks[0]]);
    prismaMock.testStudentAttempt.findMany.mockResolvedValue([
      {
        id: 401,
        status: 'COMPLETED',
        startedAt: new Date('2026-05-10T10:00:00.000Z'),
        finishedAt: null,
        publicLink: publicLinks[0],
        topicVersion: publicLinks[0].topicVersion,
        analysis: { status: 'READY', summary: createV3Summary() },
        educationOrganization: null,
        groupOrClass: null,
        studentGender: null,
        studentAge: null,
        studentResidence: null,
        studentEducationLevel: null,
      },
    ]);

    await service.getSummary(7, 1, {
      scope: 'TOPIC',
      linkStatus: 'ALL',
    });

    expect(prismaMock.testStudentAttempt.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          publicLinkId: { in: [11] },
        },
        select: {
          id: true,
          status: true,
          startedAt: true,
          finishedAt: true,
          publicLink: {
            select: {
              id: true,
              shortCode: true,
              archivedAt: true,
              topicVersion: {
                select: {
                  versionNumber: true,
                  title: true,
                  _count: {
                    select: { questions: true },
                  },
                },
              },
            },
          },
          topicVersion: {
            select: {
              versionNumber: true,
              title: true,
              _count: {
                select: { questions: true },
              },
            },
          },
          analysis: {
            select: {
              status: true,
              summary: true,
            },
          },
          educationOrganization: true,
          groupOrClass: true,
          studentGender: true,
          studentAge: true,
          studentResidence: true,
          studentEducationLevel: true,
        },
      }),
    );
  });
});
