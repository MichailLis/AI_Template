import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { mapAttemptDetail, mapAttemptListItem } from './tests-attempt.mapper';
import { ensureTestsAdminAccess } from './tests-admin-access.utils';
import { TestsAnalysisService } from './tests-analysis.service';

@Injectable()
export class TestsAdminAttemptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analysisService: TestsAnalysisService,
  ) {}

  async listAttemptsForLink(userId: number, linkId: number) {
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

    const attempts = await this.prisma.testStudentAttempt.findMany({
      where: {
        publicLinkId: linkId,
      },
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
    });

    return {
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

    return mapAttemptDetail(attempt, (currentAttempt) =>
      this.analysisService.toAttemptStatus(currentAttempt),
    );
  }
}
