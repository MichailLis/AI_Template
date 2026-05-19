import { Injectable, NotFoundException } from '@nestjs/common';

import { ProfessionAtlasSettingsService } from '../app-settings/profession-atlas-settings.service';
import { PrismaService } from '../prisma.service';
import type { AdminPublicAttemptsListQueryDto } from './dto/tests-links.dto';
import { mapAttemptDetail, mapAttemptListItem } from './tests-attempt.mapper';
import { ensureTestsAdminAccess } from './tests-admin-access.utils';
import { TestsAnalysisService } from './tests-analysis.service';

@Injectable()
export class TestsAdminAttemptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analysisService: TestsAnalysisService,
    private readonly professionAtlasSettingsService: ProfessionAtlasSettingsService,
  ) {}

  async listAttemptsForLink(
    userId: number,
    linkId: number,
    query: AdminPublicAttemptsListQueryDto,
  ) {
    await ensureTestsAdminAccess(this.prisma, userId);

    const link = await this.prisma.testPublicLink.findUnique({
      where: {
        id: linkId,
      },
      select: {
        id: true,
      },
    });

    if (!link) {
      throw new NotFoundException('Public link not found');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = {
      publicLinkId: linkId,
    };
    const total = await this.prisma.testStudentAttempt.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(page, totalPages);
    const skip = (currentPage - 1) * limit;

    const attempts = await this.prisma.testStudentAttempt.findMany({
      where,
      include: {
        analysis: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
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
    };
  }

  async getAttemptDetail(userId: number, attemptId: number) {
    await ensureTestsAdminAccess(this.prisma, userId);

    const attempt = await this.prisma.testStudentAttempt.findUnique({
      where: {
        id: attemptId,
      },
      include: {
        publicLink: {
          select: {
            id: true,
            shortCode: true,
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
      throw new NotFoundException('Attempt not found');
    }

    const professionAtlasUrl = await this.professionAtlasSettingsService.getProfessionAtlasUrl();

    return mapAttemptDetail(
      attempt,
      (currentAttempt) => this.analysisService.toAttemptStatus(currentAttempt),
      professionAtlasUrl,
    );
  }
}
