import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service';
import { buildV3AnalyticsSections, getV3Summary, toShare } from './tests-analytics-summary';
import type {
  AdminTestAnalyticsQueryDto,
  AdminTestAnalyticsSummaryDto,
} from './dto/tests-analytics.dto';
import { ensureAdminAccess } from '../common/authz/admin-access.utils';

const PUBLIC_LINK_SELECT = {
  id: true,
  shortCode: true,
  archivedAt: true,
  topicVersion: {
    select: {
      title: true,
      versionNumber: true,
      _count: {
        select: {
          questions: true,
        },
      },
    },
  },
} as const satisfies Prisma.TestPublicLinkSelect;

const TOPIC_SELECT = {
  id: true,
  slug: true,
  archivedAt: true,
  activePublishedVersion: {
    select: {
      title: true,
      _count: {
        select: {
          questions: true,
        },
      },
    },
  },
} as const satisfies Prisma.TestTopicSelect;

const ATTEMPT_SELECT = {
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
            select: {
              questions: true,
            },
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
        select: {
          questions: true,
        },
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
} as const satisfies Prisma.TestStudentAttemptSelect;

type V3Summary = ReturnType<typeof getV3Summary>;
type AttemptRecord = Prisma.TestStudentAttemptGetPayload<{ select: typeof ATTEMPT_SELECT }>;

const UNSPECIFIED_LABEL = 'не указано';

const getDateStartUtc = (value: string) => {
  const date = new Date(value);

  date.setUTCHours(0, 0, 0, 0);

  return date;
};

const getDateEndUtc = (value: string) => {
  const date = new Date(value);

  date.setUTCHours(23, 59, 59, 999);

  return date;
};

const getLinkStatusFilter = (linkStatus: 'ALL' | 'ACTIVE' | 'ARCHIVED') => {
  if (linkStatus === 'ACTIVE') {
    return { archivedAt: null };
  }

  if (linkStatus === 'ARCHIVED') {
    return { archivedAt: { not: null } };
  }

  return {};
};

const toAttemptRecord = (attempt: AttemptRecord) => ({
  attemptId: attempt.id,
  publicLinkId: attempt.publicLink.id,
  shortCode: attempt.publicLink.shortCode,
  startedAt: attempt.startedAt.toISOString(),
  finishedAt: attempt.finishedAt ? attempt.finishedAt.toISOString() : null,
  status: attempt.status,
  analysisStatus: attempt.analysis?.status ?? null,
});

const buildShareSection = (counts: Map<string, number>, total: number) =>
  Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      share: toShare(count, total),
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));

const mapAgeRange = (age: number | null) => {
  if (!age) {
    return UNSPECIFIED_LABEL;
  }

  if (age < 14) {
    return 'до 14';
  }

  if (age <= 15) {
    return '14-15';
  }

  if (age <= 17) {
    return '16-17';
  }

  return '18+';
};

@Injectable()
export class TestsAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(
    userId: number,
    topicId: number,
    query: AdminTestAnalyticsQueryDto,
  ): Promise<AdminTestAnalyticsSummaryDto> {
    await ensureAdminAccess(this.prisma, userId);

    const topic = await this.prisma.testTopic.findUnique({
      where: {
        id: topicId,
      },
      select: TOPIC_SELECT,
    });

    if (!topic) {
      throw new NotFoundException('Test topic not found');
    }

    if (query.scope === 'PUBLIC_LINK') {
      const checkedLink = await this.prisma.testPublicLink.findUnique({
        where: {
          id: query.publicLinkId,
        },
        select: {
          topicVersion: {
            select: {
              topicId: true,
            },
          },
        },
      });

      if (!checkedLink || checkedLink.topicVersion.topicId !== topicId) {
        throw new NotFoundException('Public link not found');
      }
    }

    const linkWhere:
      | Prisma.TestPublicLinkWhereInput
      | (Prisma.TestPublicLinkWhereInput & { id: number }) =
      query.scope === 'TOPIC'
        ? {
            ...getLinkStatusFilter(query.linkStatus),
            topicVersion: {
              topicId,
            },
          }
        : {
            id: query.publicLinkId,
            ...getLinkStatusFilter(query.linkStatus),
          };

    const links = await this.prisma.testPublicLink.findMany({
      where: linkWhere,
      select: PUBLIC_LINK_SELECT,
      orderBy: {
        id: 'asc',
      },
    });

    const linkIds = links.map((link) => link.id);
    const startedAtWhere: Prisma.DateTimeFilter = {};
    if (query.dateFrom) {
      startedAtWhere.gte = getDateStartUtc(query.dateFrom);
    }
    if (query.dateTo) {
      startedAtWhere.lte = getDateEndUtc(query.dateTo);
    }
    const attemptDateWhere: Prisma.TestStudentAttemptWhereInput = {
      publicLinkId: {
        in: linkIds,
      },
      ...(Object.keys(startedAtWhere).length > 0 ? { startedAt: startedAtWhere } : {}),
    };

    const attempts =
      linkIds.length === 0
        ? []
        : await this.prisma.testStudentAttempt.findMany({
            where: attemptDateWhere,
            select: ATTEMPT_SELECT,
            orderBy: {
              startedAt: 'desc',
            },
          });

    const coverage = {
      publicLinks: links.length,
      attemptsTotal: 0,
      attemptsCompleted: 0,
      analysisReady: 0,
      analysisPending: 0,
      analysisFailed: 0,
      analysisMissing: 0,
      v3Results: 0,
    };
    const attemptsByPublicLinkId = new Map<number, AttemptRecord[]>();

    for (const attempt of attempts) {
      const linkAttempts = attemptsByPublicLinkId.get(attempt.publicLink.id) ?? [];
      linkAttempts.push(attempt);
      attemptsByPublicLinkId.set(attempt.publicLink.id, linkAttempts);

      coverage.attemptsTotal += 1;

      if (attempt.status === 'COMPLETED') {
        coverage.attemptsCompleted += 1;
      }

      if (!attempt.analysis) {
        coverage.analysisMissing += 1;
        continue;
      }

      if (attempt.analysis.status === 'READY') {
        coverage.analysisReady += 1;
      } else if (attempt.analysis.status === 'PENDING') {
        coverage.analysisPending += 1;
      } else if (attempt.analysis.status === 'FAILED') {
        coverage.analysisFailed += 1;
      }
    }

    const coverageV3Summaries = attempts
      .map((attempt) => getV3Summary(attempt.analysis?.summary))
      .filter((summary): summary is NonNullable<V3Summary> => summary !== null);
    coverage.v3Results = coverageV3Summaries.length;

    const publicLinkRows = links.map((link) => {
      const linkAttempts = attemptsByPublicLinkId.get(link.id) ?? [];

      return {
        publicLinkId: link.id,
        shortCode: link.shortCode,
        title: link.topicVersion.title,
        archivedAt: link.archivedAt ? link.archivedAt.toISOString() : null,
        attemptsTotal: linkAttempts.length,
        attemptsCompleted: linkAttempts.filter((attempt) => attempt.status === 'COMPLETED').length,
        analysisReady: linkAttempts.filter((attempt) => attempt.analysis?.status === 'READY')
          .length,
        share: toShare(linkAttempts.length, coverage.attemptsTotal),
      };
    });

    const groupsMap = new Map<
      string,
      {
        educationOrganization: string | null;
        groupOrClass: string | null;
        attemptsTotal: number;
        attemptsCompleted: number;
        analysisReady: number;
      }
    >();

    const demographicCounts = {
      gender: new Map<string, number>(),
      ageRange: new Map<string, number>(),
      residence: new Map<string, number>(),
      educationLevel: new Map<string, number>(),
    };

    for (const attempt of attempts) {
      const gender = attempt.studentGender ?? UNSPECIFIED_LABEL;
      demographicCounts.gender.set(gender, (demographicCounts.gender.get(gender) ?? 0) + 1);

      const ageRange = mapAgeRange(attempt.studentAge);
      demographicCounts.ageRange.set(ageRange, (demographicCounts.ageRange.get(ageRange) ?? 0) + 1);

      const residence = attempt.studentResidence ?? UNSPECIFIED_LABEL;
      demographicCounts.residence.set(
        residence,
        (demographicCounts.residence.get(residence) ?? 0) + 1,
      );

      const educationLevel = attempt.studentEducationLevel ?? UNSPECIFIED_LABEL;
      demographicCounts.educationLevel.set(
        educationLevel,
        (demographicCounts.educationLevel.get(educationLevel) ?? 0) + 1,
      );

      const key = `${attempt.educationOrganization ?? ''}\u0000${attempt.groupOrClass ?? ''}`;
      const current = groupsMap.get(key) ?? {
        educationOrganization: attempt.educationOrganization,
        groupOrClass: attempt.groupOrClass,
        attemptsTotal: 0,
        attemptsCompleted: 0,
        analysisReady: 0,
      };

      current.attemptsTotal += 1;
      current.attemptsCompleted += attempt.status === 'COMPLETED' ? 1 : 0;
      current.analysisReady += attempt.analysis?.status === 'READY' ? 1 : 0;
      groupsMap.set(key, current);
    }

    const groups = Array.from(groupsMap.values())
      .map((group) => ({
        ...group,
        share: toShare(group.attemptsTotal, coverage.attemptsTotal),
      }))
      .sort(
        (left, right) =>
          right.attemptsTotal - left.attemptsTotal ||
          (left.educationOrganization ?? '').localeCompare(right.educationOrganization ?? '') ||
          (left.groupOrClass ?? '').localeCompare(right.groupOrClass ?? ''),
      );

    const v3Sections = buildV3AnalyticsSections(
      attempts.map((attempt) => ({
        attemptId: attempt.id,
        status: attempt.status,
        analysisStatus: attempt.analysis?.status ?? null,
        summary: attempt.analysis?.summary,
      })),
    );

    const topicSummary = topic.activePublishedVersion ?? {
      title: 'Тема теста',
      _count: {
        questions: 0,
      },
    };

    return {
      topic: {
        topicId: topic.id,
        slug: topic.slug,
        title: topicSummary.title,
        questionCount: topicSummary._count.questions,
        generatedAt: new Date().toISOString(),
      },
      filters: {
        scope: query.scope,
        publicLinkId: query.scope === 'PUBLIC_LINK' ? (query.publicLinkId ?? null) : null,
        linkStatus: query.linkStatus,
        dateFrom: query.dateFrom ?? null,
        dateTo: query.dateTo ?? null,
      },
      coverage,
      directions: v3Sections.directions,
      directionPairs: v3Sections.directionPairs,
      scoreAverages: v3Sections.scoreAverages,
      profiles: v3Sections.profiles,
      confidence: v3Sections.confidence,
      flags: v3Sections.flags,
      publicLinks: publicLinkRows,
      groups,
      demographics: {
        gender: buildShareSection(demographicCounts.gender, coverage.attemptsTotal),
        ageRange: buildShareSection(demographicCounts.ageRange, coverage.attemptsTotal),
        residence: buildShareSection(demographicCounts.residence, coverage.attemptsTotal),
        educationLevel: buildShareSection(demographicCounts.educationLevel, coverage.attemptsTotal),
      },
      attempts: attempts.map((attempt) => toAttemptRecord(attempt)),
    };
  }
}
