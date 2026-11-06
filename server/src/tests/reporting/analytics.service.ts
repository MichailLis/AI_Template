import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma.service';
import {
  getAnalysisResultKind,
  type AnalysisResultKind,
  isAnalysisResultWithoutAi,
  isMeaningfulAnalysisResult,
} from '../analysis/analysis-result-kind';
import { getAnalyticsSections, getSummaryLlmStatus } from '../methodology/registry';
import type { AnalysisLlmStatus } from '../methodology/scoring-methodology';
import { toShare } from '../reporting/analytics-summary';
import type {
  AdminTestAnalyticsQueryDto,
  AdminTestAnalyticsSummaryDto,
} from '../dto/tests-analytics.dto';
import { getZonedDayEnd, getZonedDayStart, resolveTimeZone } from '../../common/time-zone';

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
      scoringKind: true,
      scoringConfig: true,
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
      providerMode: true,
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

type AttemptRecord = Prisma.TestStudentAttemptGetPayload<{ select: typeof ATTEMPT_SELECT }>;

const UNSPECIFIED_LABEL = 'не указано';

const getLinkStatusFilter = (linkStatus: 'ALL' | 'ACTIVE' | 'ARCHIVED') => {
  if (linkStatus === 'ACTIVE') {
    return { archivedAt: null };
  }

  if (linkStatus === 'ARCHIVED') {
    return { archivedAt: { not: null } };
  }

  return {};
};

const toAttemptRecord = (
  attempt: AttemptRecord,
  analysisKind: AnalysisResultKind,
  llmStatus: AnalysisLlmStatus | null,
) => ({
  attemptId: attempt.id,
  publicLinkId: attempt.publicLink.id,
  shortCode: attempt.publicLink.shortCode,
  startedAt: attempt.startedAt.toISOString(),
  finishedAt: attempt.finishedAt ? attempt.finishedAt.toISOString() : null,
  status: attempt.status,
  analysisStatus: attempt.analysis?.status ?? null,
  llmStatus,
  analysisResultKind: analysisKind,
});

/** Сколько последних попыток отдаёт экран аналитики; полный список нужен только выгрузке. */
export const RECENT_ATTEMPTS_LIMIT = 12;

/** Размер пачки чтения попыток: в памяти одновременно не больше стольких `summary`. */
const ATTEMPT_BATCH_SIZE = 500;

type AttemptRow = ReturnType<typeof toAttemptRecord>;

export type AnalyticsSummaryWithAttempts = AdminTestAnalyticsSummaryDto & {
  /** Все попытки в порядке «новые первыми» — для листа XLSX. */
  attempts: AttemptRow[];
};

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
    topicId: number,
    query: AdminTestAnalyticsQueryDto,
    options: { batchSize?: number } = {},
  ): Promise<AdminTestAnalyticsSummaryDto> {
    const { summary } = await this.buildSummary(topicId, query, {
      ...options,
      keepAttempts: RECENT_ATTEMPTS_LIMIT,
    });

    return summary;
  }

  /** Сводка для выгрузок: те же цифры, что на экране, плюс полный список попыток. */
  async getExportSummary(
    topicId: number,
    query: AdminTestAnalyticsQueryDto,
    options: { batchSize?: number } = {},
  ): Promise<AnalyticsSummaryWithAttempts> {
    const { summary, attempts } = await this.buildSummary(topicId, query, {
      ...options,
      keepAttempts: Infinity,
    });

    return { ...summary, attempts };
  }

  private async buildSummary(
    topicId: number,
    query: AdminTestAnalyticsQueryDto,
    options: { batchSize?: number; keepAttempts: number },
  ): Promise<{ summary: AdminTestAnalyticsSummaryDto; attempts: AttemptRow[] }> {
    const topic = await this.prisma.testTopic.findUnique({
      where: {
        id: topicId,
      },
      select: TOPIC_SELECT,
    });

    if (!topic) {
      throw new NotFoundException('Test topic not found', 'TEST_TOPIC_NOT_FOUND');
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
        throw new NotFoundException('Public link not found', 'PUBLIC_LINK_NOT_FOUND');
      }
    }

    const linkWhere:
      Prisma.TestPublicLinkWhereInput | (Prisma.TestPublicLinkWhereInput & { id: number }) =
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
    const timeZone = resolveTimeZone(query.timeZone);
    const startedAtWhere: Prisma.DateTimeFilter = {};
    if (query.dateFrom) {
      startedAtWhere.gte = getZonedDayStart(query.dateFrom, timeZone);
    }
    if (query.dateTo) {
      startedAtWhere.lte = getZonedDayEnd(query.dateTo, timeZone);
    }
    const attemptDateWhere: Prisma.TestStudentAttemptWhereInput = {
      publicLinkId: {
        in: linkIds,
      },
      ...(Object.keys(startedAtWhere).length > 0 ? { startedAt: startedAtWhere } : {}),
    };

    const coverage = {
      publicLinks: links.length,
      attemptsTotal: 0,
      attemptsCompleted: 0,
      analysisReady: 0,
      analysisAiReady: 0,
      analysisWithoutAi: 0,
      analysisStub: 0,
      analysisPending: 0,
      analysisFailed: 0,
      analysisMissing: 0,
      v3Results: 0,
    };
    const linkCounts = new Map<
      number,
      { total: number; completed: number; ready: number; stub: number }
    >();
    const groupsMap = new Map<
      string,
      {
        educationOrganization: string | null;
        groupOrClass: string | null;
        attemptsTotal: number;
        attemptsCompleted: number;
      }
    >();
    const demographicCounts = {
      gender: new Map<string, number>(),
      ageRange: new Map<string, number>(),
      residence: new Map<string, number>(),
      educationLevel: new Map<string, number>(),
    };
    const analytics = getAnalyticsSections();
    const facts: unknown[] = [];
    const attemptRows: AttemptRow[] = [];
    const batchSize = options.batchSize ?? ATTEMPT_BATCH_SIZE;

    /**
     * Попытки читаются пачками по курсору, а `summary` сразу сворачивается в лёгкую проекцию:
     * целиком JSON (около 11 КБ на попытку) в памяти не накапливается.
     */
    let cursorId: number | undefined;
    while (linkIds.length > 0) {
      const batch: AttemptRecord[] = await this.prisma.testStudentAttempt.findMany({
        where: attemptDateWhere,
        select: ATTEMPT_SELECT,
        orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
        take: batchSize,
        ...(cursorId === undefined ? {} : { cursor: { id: cursorId }, skip: 1 }),
      });

      for (const attempt of batch) {
        const summaryJson = attempt.analysis?.summary;
        const linkCount = linkCounts.get(attempt.publicLink.id) ?? {
          total: 0,
          completed: 0,
          ready: 0,
          stub: 0,
        };
        linkCounts.set(attempt.publicLink.id, linkCount);
        linkCount.total += 1;
        coverage.attemptsTotal += 1;

        if (attempt.status === 'COMPLETED') {
          linkCount.completed += 1;
          coverage.attemptsCompleted += 1;
        }

        /**
         * `status === 'READY'` не означает, что анализ содержательный: так помечены и заглушки, и
         * двухфазный prof-orientation сразу после алгоритмической фазы. Показатели считаются по
         * источнику результата, иначе заглушка давала «готовый анализ 100%».
         */
        const analysisKind = getAnalysisResultKind(attempt.analysis);

        if (isMeaningfulAnalysisResult(analysisKind)) {
          linkCount.ready += 1;
        }

        if (analysisKind === 'STUB') {
          linkCount.stub += 1;
        }

        if (analysisKind === 'MISSING') {
          coverage.analysisMissing += 1;
        } else if (analysisKind === 'PENDING') {
          coverage.analysisPending += 1;
        } else if (analysisKind === 'FAILED') {
          coverage.analysisFailed += 1;
        } else if (analysisKind === 'STUB') {
          coverage.analysisStub += 1;
        } else {
          coverage.analysisReady += 1;

          if (isAnalysisResultWithoutAi(analysisKind)) {
            coverage.analysisWithoutAi += 1;
          } else {
            coverage.analysisAiReady += 1;
          }
        }

        const attemptFacts = analytics.toFacts(summaryJson);
        if (attemptFacts !== null) {
          facts.push(attemptFacts);
        }

        if (attemptRows.length < options.keepAttempts) {
          attemptRows.push(
            toAttemptRecord(attempt, analysisKind, getSummaryLlmStatus(summaryJson)),
          );
        }

        const gender = attempt.studentGender ?? UNSPECIFIED_LABEL;
        demographicCounts.gender.set(gender, (demographicCounts.gender.get(gender) ?? 0) + 1);

        const ageRange = mapAgeRange(attempt.studentAge);
        demographicCounts.ageRange.set(
          ageRange,
          (demographicCounts.ageRange.get(ageRange) ?? 0) + 1,
        );

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
        };

        current.attemptsTotal += 1;
        current.attemptsCompleted += attempt.status === 'COMPLETED' ? 1 : 0;
        groupsMap.set(key, current);
      }

      if (batch.length < batchSize) {
        break;
      }
      cursorId = batch[batch.length - 1].id;
    }

    coverage.v3Results = facts.length;

    const publicLinkRows = links.map((link) => {
      const counts = linkCounts.get(link.id);

      return {
        publicLinkId: link.id,
        shortCode: link.shortCode,
        title: link.topicVersion.title,
        archivedAt: link.archivedAt ? link.archivedAt.toISOString() : null,
        attemptsTotal: counts?.total ?? 0,
        attemptsCompleted: counts?.completed ?? 0,
        analysisReady: counts?.ready ?? 0,
        analysisStub: counts?.stub ?? 0,
        share: toShare(counts?.total ?? 0, coverage.attemptsTotal),
      };
    });

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

    const v3Sections = analytics.buildSections(facts, topic.activePublishedVersion?.scoringConfig);

    const topicSummary = topic.activePublishedVersion ?? {
      title: 'Тема теста',
      scoringKind: 'DEFAULT' as const,
      _count: {
        questions: 0,
      },
    };

    const summary: AdminTestAnalyticsSummaryDto = {
      topic: {
        topicId: topic.id,
        slug: topic.slug,
        title: topicSummary.title,
        questionCount: topicSummary._count.questions,
        scoringKind: topicSummary.scoringKind,
        generatedAt: new Date().toISOString(),
      },
      filters: {
        scope: query.scope,
        publicLinkId: query.scope === 'PUBLIC_LINK' ? (query.publicLinkId ?? null) : null,
        linkStatus: query.linkStatus,
        dateFrom: query.dateFrom ?? null,
        dateTo: query.dateTo ?? null,
        timeZone,
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
      recentAttempts: attemptRows.slice(0, RECENT_ATTEMPTS_LIMIT),
    };

    return { summary, attempts: attemptRows };
  }
}
