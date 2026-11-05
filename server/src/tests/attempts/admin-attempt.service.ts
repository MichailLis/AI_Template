import { Injectable, NotFoundException } from '@nestjs/common';

import { ProfessionAtlasSettingsService } from '../../app-settings/profession-atlas-settings.service';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma.service';
import type { AdminPublicAttemptsListQueryDto } from '../dto/tests-links.dto';
import { mapAttemptDetail, mapAttemptListItem } from '../attempts/attempt.mapper';
import { TestsAnalysisService } from '../analysis/analysis.service';
import {
  RESTART_BATCH_LIMIT,
  countFailedAnalyses,
  findFailedAttemptIds,
} from '../analysis/analysis-restart';
import { buildAttemptListOrderBy, buildAttemptListWhere } from './attempt-list-query';

/** Верхняя граница выгрузки: файл должен собираться в памяти за один запрос. */
export const ATTEMPTS_EXPORT_LIMIT = 5000;

@Injectable()
export class TestsAdminAttemptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analysisService: TestsAnalysisService,
    private readonly professionAtlasSettingsService: ProfessionAtlasSettingsService,
    private readonly auditService: AuditService,
  ) {}

  async listAttemptsForLink(linkId: number, query: AdminPublicAttemptsListQueryDto) {
    const link = await this.prisma.testPublicLink.findUnique({
      where: {
        id: linkId,
      },
      select: {
        id: true,
      },
    });

    if (!link) {
      throw new NotFoundException('Public link not found', 'PUBLIC_LINK_NOT_FOUND');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = buildAttemptListWhere(linkId, query);
    const total = await this.prisma.testStudentAttempt.count({ where });
    const failedAnalysisCount = await countFailedAnalyses(this.prisma, linkId);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(page, totalPages);
    const skip = (currentPage - 1) * limit;

    const attempts = await this.prisma.testStudentAttempt.findMany({
      where,
      include: {
        publicLink: {
          select: {
            entryProfileMode: true,
          },
        },
        analysis: {
          select: {
            providerMode: true,
            status: true,
            summary: true,
          },
        },
      },
      orderBy: buildAttemptListOrderBy(query),
      skip,
      take: limit,
    });

    return {
      page: currentPage,
      limit,
      total,
      totalPages,
      attempts: attempts.map((attempt) =>
        mapAttemptListItem(attempt, (currentAttempt) =>
          this.analysisService.toAttemptStatus(currentAttempt),
        ),
      ),
      failedAnalysisCount,
    };
  }

  /** Перезапуск одного упавшего анализа; `restarted: false` — нечего перезапускать или уже перезапущен. */
  async restartAttemptAnalysis(attemptId: number) {
    const attempt = await this.prisma.testStudentAttempt.findUnique({
      where: { id: attemptId },
      select: { publicLinkId: true },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found', 'ATTEMPT_NOT_FOUND');
    }

    return {
      publicLinkId: attempt.publicLinkId,
      restarted: await this.analysisService.restartFailedAnalysis(attemptId),
    };
  }

  /** Перезапуск упавших анализов ссылки, не больше `RESTART_BATCH_LIMIT` за запрос. */
  async restartFailedAnalysesForLink(linkId: number) {
    const link = await this.prisma.testPublicLink.findUnique({
      where: { id: linkId },
      select: { id: true },
    });

    if (!link) {
      throw new NotFoundException('Public link not found', 'PUBLIC_LINK_NOT_FOUND');
    }

    const attemptIds = await findFailedAttemptIds(this.prisma, {
      linkId,
      take: RESTART_BATCH_LIMIT,
    });
    let restarted = 0;

    for (const attemptId of attemptIds) {
      if (await this.analysisService.restartFailedAnalysis(attemptId)) {
        restarted += 1;
      }
    }

    return { restarted };
  }

  async listAttemptsForExport(linkId: number, query: AdminPublicAttemptsListQueryDto) {
    const link = await this.prisma.testPublicLink.findUnique({
      where: { id: linkId },
      select: { id: true, shortCode: true },
    });

    if (!link) {
      throw new NotFoundException('Public link not found', 'PUBLIC_LINK_NOT_FOUND');
    }

    const attempts = await this.prisma.testStudentAttempt.findMany({
      where: buildAttemptListWhere(linkId, query),
      include: {
        publicLink: { select: { entryProfileMode: true } },
        analysis: { select: { providerMode: true, status: true, summary: true } },
      },
      orderBy: buildAttemptListOrderBy(query),
      take: ATTEMPTS_EXPORT_LIMIT + 1,
    });

    return {
      shortCode: link.shortCode,
      truncated: attempts.length > ATTEMPTS_EXPORT_LIMIT,
      attempts: attempts
        .slice(0, ATTEMPTS_EXPORT_LIMIT)
        .map((attempt) =>
          mapAttemptListItem(attempt, (currentAttempt) =>
            this.analysisService.toAttemptStatus(currentAttempt),
          ),
        ),
    };
  }

  async getAttemptDetail(attemptId: number) {
    const attempt = await this.prisma.testStudentAttempt.findUnique({
      where: {
        id: attemptId,
      },
      include: {
        publicLink: {
          select: {
            id: true,
            shortCode: true,
            entryProfileMode: true,
          },
        },
        answers: {
          orderBy: {
            updatedAt: 'desc',
          },
        },
        analysis: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found', 'ATTEMPT_NOT_FOUND');
    }

    const professionAtlasUrl = await this.professionAtlasSettingsService.getProfessionAtlasUrl();

    return mapAttemptDetail(
      attempt,
      (currentAttempt) => this.analysisService.toAttemptStatus(currentAttempt),
      professionAtlasUrl,
    );
  }

  /**
   * Необратимое удаление прохождения. Ответы и анализ уходят каскадом по внешним ключам. Попытка
   * ищется внутри своей ссылки, поэтому чужой id даёт тот же 404, что и несуществующий. В журнале
   * только id: ФИО и класс ученика туда не пишем, это ПДн.
   */
  async deleteAttempt(userId: number, linkId: number, attemptId: number) {
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.testStudentAttempt.deleteMany({
        where: { id: attemptId, publicLinkId: linkId },
      });

      if (count === 0) {
        throw new NotFoundException('Attempt not found', 'ATTEMPT_NOT_FOUND');
      }

      await this.auditService.record(
        {
          entityType: 'PUBLIC_LINK',
          entityId: linkId,
          action: 'ATTEMPT_DELETED',
          actorUserId: userId,
          changes: [{ field: 'attemptId', before: String(attemptId), after: null }],
        },
        tx,
      );
    });

    return { linkId, attemptId };
  }
}
