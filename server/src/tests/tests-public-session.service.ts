import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import type {
  PublicSessionSaveAnswersRequestDto,
  PublicSessionStartRequestDto,
} from './dto/tests-public.dto';
import { mapSessionState, toOptionalIsoString } from './tests-attempt.mapper';
import { getSessionAttemptByTokenOrThrow } from './tests-attempt-access';
import { ensureAttemptCanAcceptAnswers } from './tests-attempt.guards';
import {
  buildStudentKeyHash,
  createRandomToken,
  toPrismaRequiredJsonInput,
} from './tests-domain.utils';
import { TestsAnalysisService } from './tests-analysis.service';
import { TestsPublicLinkService } from './tests-public-link.service';

type SessionStateResponse = {
  session: ReturnType<typeof mapSessionState>;
};

@Injectable()
export class TestsPublicSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publicLinkService: TestsPublicLinkService,
    private readonly analysisService: TestsAnalysisService,
  ) {}

  private matchesGroupPattern(groupOrClass: string, pattern: string) {
    try {
      return new RegExp(pattern, 'u').test(groupOrClass);
    } catch {
      return true;
    }
  }

  private validateGroupOrClassForLink(
    groupOrClass: string,
    link: Awaited<ReturnType<TestsPublicLinkService['getAccessiblePublicLinkByCode']>>,
  ) {
    const validationMode = link.educationOrganization?.groupValidationMode ?? 'NONE';
    const validationPattern = link.educationOrganization?.groupValidationPattern;

    if (validationMode !== 'STRICT' || !validationPattern) {
      return;
    }

    if (!this.matchesGroupPattern(groupOrClass, validationPattern)) {
      throw new BadRequestException(
        link.educationOrganization?.groupValidationHint ||
          'Формат поля "Группа / класс" не соответствует требованиям учебного заведения',
      );
    }
  }

  async startSessionByCode(
    shortCode: string,
    dto: PublicSessionStartRequestDto,
  ): Promise<SessionStateResponse> {
    const link = await this.publicLinkService.getAccessiblePublicLinkByCode(shortCode);
    const resolvedEducationOrganization =
      link.educationOrganization?.name ?? dto.educationOrganization?.trim() ?? '';

    if (!resolvedEducationOrganization) {
      throw new BadRequestException('Учебное заведение обязательно для начала теста');
    }

    const normalizedGroupOrClass = dto.groupOrClass.trim();
    this.validateGroupOrClassForLink(normalizedGroupOrClass, link);

    const studentKeyHash = buildStudentKeyHash({
      ...dto,
      educationOrganization: resolvedEducationOrganization,
      groupOrClass: normalizedGroupOrClass,
    });
    const now = new Date();

    await this.prisma.testStudentAttempt.updateMany({
      where: {
        publicLinkId: link.id,
        studentKeyHash,
        status: 'IN_PROGRESS',
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: 'EXPIRED',
        finishedAt: now,
      },
    });

    const previousAttempts = await this.prisma.testStudentAttempt.findMany({
      where: {
        publicLinkId: link.id,
        studentKeyHash,
      },
      select: {
        id: true,
        attemptNumber: true,
        status: true,
        resumeToken: true,
        expiresAt: true,
      },
      orderBy: {
        attemptNumber: 'desc',
      },
    });

    if (link.allowResume) {
      const resumableAttempt = previousAttempts.find(
        (attempt) =>
          attempt.status === 'IN_PROGRESS' &&
          (!attempt.expiresAt || attempt.expiresAt.getTime() > now.getTime()),
      );

      if (resumableAttempt) {
        return this.getSessionByToken(resumableAttempt.resumeToken);
      }
    }

    if (previousAttempts.length >= link.maxAttemptsPerStudent) {
      throw new BadRequestException('Attempts limit reached for this test link');
    }

    const nextAttemptNumber = (previousAttempts[0]?.attemptNumber ?? 0) + 1;
    const expiresAt =
      link.timeLimitMinutes !== null
        ? new Date(now.getTime() + link.timeLimitMinutes * 60 * 1000)
        : null;

    const createdAttempt = await this.prisma.testStudentAttempt.create({
      data: {
        publicLinkId: link.id,
        topicVersionId: link.topicVersionId,
        attemptNumber: nextAttemptNumber,
        status: 'IN_PROGRESS',
        studentName: dto.studentName,
        studentLastInitial: dto.studentLastInitial,
        studentMiddleInitial: dto.studentMiddleInitial,
        educationOrganization: resolvedEducationOrganization,
        groupOrClass: normalizedGroupOrClass,
        studentKeyHash,
        consentAcceptedAt: now,
        consentVersion: link.consentVersion,
        consentTextSnapshot: link.consentTextSnapshot,
        resumeToken: createRandomToken(24),
        startedAt: now,
        expiresAt,
      },
    });

    return this.getSessionByToken(createdAttempt.resumeToken);
  }

  async getSessionByToken(sessionToken: string): Promise<SessionStateResponse> {
    const attempt = await getSessionAttemptByTokenOrThrow(this.prisma, sessionToken);

    return {
      session: mapSessionState(attempt, (currentAttempt) =>
        this.analysisService.toAttemptStatus(currentAttempt),
      ),
    } satisfies SessionStateResponse;
  }

  async saveAnswers(sessionToken: string, dto: PublicSessionSaveAnswersRequestDto) {
    const attempt = await getSessionAttemptByTokenOrThrow(this.prisma, sessionToken);
    ensureAttemptCanAcceptAnswers(attempt);

    const questionMap = new Map(
      attempt.topicVersion.questions.map((question) => [question.id, question]),
    );

    for (const answer of dto.answers) {
      if (!questionMap.has(answer.questionId)) {
        throw new BadRequestException(
          `Question ${answer.questionId} does not belong to this session`,
        );
      }
    }

    const answers = await this.prisma.$transaction(async (tx) => {
      for (const answer of dto.answers) {
        const question = questionMap.get(answer.questionId)!;
        const answerPayload = toPrismaRequiredJsonInput(answer.answerPayload);

        await tx.testStudentAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId: attempt.id,
              questionId: answer.questionId,
            },
          },
          create: {
            attemptId: attempt.id,
            questionId: answer.questionId,
            questionTypeSnapshot: question.type,
            questionTitleSnapshot: question.title,
            answerPayload,
          },
          update: {
            questionTypeSnapshot: question.type,
            questionTitleSnapshot: question.title,
            answerPayload,
          },
        });
      }

      return tx.testStudentAnswer.findMany({
        where: {
          attemptId: attempt.id,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    });

    return {
      sessionToken,
      status: 'IN_PROGRESS',
      answers: answers.map((answer) => ({
        questionId: answer.questionId,
        answerPayload: answer.answerPayload,
        updatedAt: answer.updatedAt.toISOString(),
      })),
    };
  }

  async finishSession(sessionToken: string) {
    const attempt = await getSessionAttemptByTokenOrThrow(this.prisma, sessionToken);

    if (attempt.status === 'EXPIRED') {
      return {
        sessionToken,
        status: 'EXPIRED',
        finishedAt: toOptionalIsoString(attempt.finishedAt),
        analysis: this.analysisService.toPublicAnalysisResponse(attempt.analysis),
      };
    }

    if (attempt.status === 'COMPLETED') {
      return {
        sessionToken,
        status: 'COMPLETED',
        finishedAt: toOptionalIsoString(attempt.finishedAt),
        analysis: this.analysisService.toPublicAnalysisResponse(attempt.analysis),
      };
    }

    ensureAttemptCanAcceptAnswers(attempt);

    const finishedAttempt = await this.prisma.$transaction(async (tx) => {
      const updatedAttempt = await tx.testStudentAttempt.update({
        where: {
          id: attempt.id,
        },
        data: {
          status: 'COMPLETED',
          finishedAt: new Date(),
        },
      });

      const answersCount = await tx.testStudentAnswer.count({
        where: {
          attemptId: attempt.id,
        },
      });

      const analysis = await this.analysisService.upsertStubAnalysis(tx, {
        attemptId: attempt.id,
        answeredQuestionsCount: answersCount,
        totalQuestionsCount: attempt.topicVersion.questions.length,
      });

      return {
        updatedAttempt,
        analysis,
      };
    });

    return {
      sessionToken,
      status: 'COMPLETED',
      finishedAt: toOptionalIsoString(finishedAttempt.updatedAttempt.finishedAt),
      analysis: this.analysisService.toPublicAnalysisResponse(finishedAttempt.analysis),
    };
  }

  async getSessionResult(sessionToken: string) {
    const attempt = await getSessionAttemptByTokenOrThrow(this.prisma, sessionToken);

    if (attempt.status === 'IN_PROGRESS') {
      throw new BadRequestException('Test session is still in progress');
    }

    return {
      sessionToken,
      status: this.analysisService.toAttemptStatus(attempt),
      finishedAt: toOptionalIsoString(attempt.finishedAt),
      analysis: this.analysisService.toPublicAnalysisResponse(attempt.analysis),
    };
  }
}
