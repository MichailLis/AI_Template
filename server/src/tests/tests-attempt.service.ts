import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service';
import type {
  PublicSessionSaveAnswersRequestDto,
  PublicSessionStartRequestDto,
} from './dto/tests-public.dto';
import {
  buildStudentKeyHash,
  createRandomToken,
  toPrismaRequiredJsonInput,
} from './tests-domain.utils';
import { TestsAnalysisService } from './tests-analysis.service';
import { TestsPublicLinkService } from './tests-public-link.service';

type AttemptWithSessionData = Prisma.TestStudentAttemptGetPayload<{
  include: {
    publicLink: true;
    topicVersion: {
      include: {
        questions: {
          orderBy: {
            order: 'asc';
          };
          include: {
            options: {
              orderBy: {
                order: 'asc';
              };
            };
            sliderBands: {
              orderBy: {
                order: 'asc';
              };
            };
          };
        };
      };
    };
    answers: {
      orderBy: {
        updatedAt: 'desc';
      };
    };
    analysis: true;
  };
}>;

@Injectable()
export class TestsAttemptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publicLinkService: TestsPublicLinkService,
    private readonly analysisService: TestsAnalysisService,
  ) {}

  private async ensureAdminAccess(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin area only');
    }
  }

  private toIso(value: Date | null) {
    return value ? value.toISOString() : null;
  }

  private mapPublicQuestion(question: AttemptWithSessionData['topicVersion']['questions'][number]) {
    return {
      id: question.id,
      type: question.type,
      title: question.title,
      description: question.description,
      required: question.required,
      order: question.order,
      settings: question.settings ?? null,
      options: question.options.map((option) => ({
        id: option.id,
        label: option.label,
        value: option.value,
        order: option.order,
      })),
      sliderBands: question.sliderBands.map((band) => ({
        id: band.id,
        minValue: band.minValue,
        maxValue: band.maxValue,
        label: band.label,
        order: band.order,
      })),
    };
  }

  private mapSessionState(attempt: AttemptWithSessionData) {
    return {
      sessionToken: attempt.resumeToken,
      shortCode: attempt.publicLink.shortCode,
      attemptNumber: attempt.attemptNumber,
      status: this.analysisService.toAttemptStatus(attempt),
      startedAt: attempt.startedAt.toISOString(),
      expiresAt: this.toIso(attempt.expiresAt),
      finishedAt: this.toIso(attempt.finishedAt),
      timeLimitMinutes: attempt.publicLink.timeLimitMinutes,
      questions: attempt.topicVersion.questions.map((question) => this.mapPublicQuestion(question)),
      answers: attempt.answers.map((answer) => ({
        questionId: answer.questionId,
        answerPayload: answer.answerPayload,
        updatedAt: answer.updatedAt.toISOString(),
      })),
    };
  }

  private async getSessionAttemptByTokenOrThrow(
    sessionToken: string,
  ): Promise<AttemptWithSessionData> {
    const attempt = await this.prisma.testStudentAttempt.findUnique({
      where: { resumeToken: sessionToken },
      include: {
        publicLink: true,
        topicVersion: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: {
                options: {
                  orderBy: { order: 'asc' },
                },
                sliderBands: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
        answers: {
          orderBy: { updatedAt: 'desc' },
        },
        analysis: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Test session not found');
    }

    const now = new Date();

    if (attempt.status === 'IN_PROGRESS' && attempt.expiresAt && now > attempt.expiresAt) {
      const expired = await this.prisma.testStudentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'EXPIRED',
          finishedAt: attempt.finishedAt ?? now,
        },
        include: {
          publicLink: true,
          topicVersion: {
            include: {
              questions: {
                orderBy: { order: 'asc' },
                include: {
                  options: {
                    orderBy: { order: 'asc' },
                  },
                  sliderBands: {
                    orderBy: { order: 'asc' },
                  },
                },
              },
            },
          },
          answers: {
            orderBy: { updatedAt: 'desc' },
          },
          analysis: true,
        },
      });

      return expired;
    }

    return attempt;
  }

  private ensureAttemptCanAcceptAnswers(attempt: AttemptWithSessionData) {
    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Test session is not active');
    }

    if (attempt.expiresAt && new Date() > attempt.expiresAt) {
      throw new BadRequestException('Test session expired');
    }
  }

  async startSessionByCode(shortCode: string, dto: PublicSessionStartRequestDto) {
    const link = await this.publicLinkService.getAccessiblePublicLinkByCode(shortCode);
    const studentKeyHash = buildStudentKeyHash(dto);
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
        educationOrganization: dto.educationOrganization,
        groupOrClass: dto.groupOrClass,
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

  async getSessionByToken(sessionToken: string) {
    const attempt = await this.getSessionAttemptByTokenOrThrow(sessionToken);

    return {
      session: this.mapSessionState(attempt),
    };
  }

  async saveAnswers(sessionToken: string, dto: PublicSessionSaveAnswersRequestDto) {
    const attempt = await this.getSessionAttemptByTokenOrThrow(sessionToken);
    this.ensureAttemptCanAcceptAnswers(attempt);

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
    const attempt = await this.getSessionAttemptByTokenOrThrow(sessionToken);

    if (attempt.status === 'EXPIRED') {
      return {
        sessionToken,
        status: 'EXPIRED',
        finishedAt: this.toIso(attempt.finishedAt),
        analysis: this.analysisService.toPublicAnalysisResponse(attempt.analysis),
      };
    }

    if (attempt.status === 'COMPLETED') {
      return {
        sessionToken,
        status: 'COMPLETED',
        finishedAt: this.toIso(attempt.finishedAt),
        analysis: this.analysisService.toPublicAnalysisResponse(attempt.analysis),
      };
    }

    this.ensureAttemptCanAcceptAnswers(attempt);

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
      finishedAt: this.toIso(finishedAttempt.updatedAttempt.finishedAt),
      analysis: this.analysisService.toPublicAnalysisResponse(finishedAttempt.analysis),
    };
  }

  async getSessionResult(sessionToken: string) {
    const attempt = await this.getSessionAttemptByTokenOrThrow(sessionToken);

    if (attempt.status === 'IN_PROGRESS') {
      throw new BadRequestException('Test session is still in progress');
    }

    return {
      sessionToken,
      status: this.analysisService.toAttemptStatus(attempt),
      finishedAt: this.toIso(attempt.finishedAt),
      analysis: this.analysisService.toPublicAnalysisResponse(attempt.analysis),
    };
  }

  async listAttemptsForLink(userId: number, linkId: number) {
    await this.ensureAdminAccess(userId);

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
      attempts: attempts.map((attempt) => ({
        attemptId: attempt.id,
        attemptNumber: attempt.attemptNumber,
        status: this.analysisService.toAttemptStatus(attempt),
        studentName: attempt.studentName,
        studentLastInitial: attempt.studentLastInitial,
        studentMiddleInitial: attempt.studentMiddleInitial,
        educationOrganization: attempt.educationOrganization,
        groupOrClass: attempt.groupOrClass,
        startedAt: attempt.startedAt.toISOString(),
        finishedAt: this.toIso(attempt.finishedAt),
        expiresAt: this.toIso(attempt.expiresAt),
        analysisStatus: attempt.analysis?.status ?? null,
      })),
    };
  }

  async getAttemptDetail(userId: number, attemptId: number) {
    await this.ensureAdminAccess(userId);

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

    return {
      attemptId: attempt.id,
      publicLinkId: attempt.publicLink.id,
      shortCode: attempt.publicLink.shortCode,
      attemptNumber: attempt.attemptNumber,
      status: this.analysisService.toAttemptStatus(attempt),
      studentName: attempt.studentName,
      studentLastInitial: attempt.studentLastInitial,
      studentMiddleInitial: attempt.studentMiddleInitial,
      educationOrganization: attempt.educationOrganization,
      groupOrClass: attempt.groupOrClass,
      consentAcceptedAt: attempt.consentAcceptedAt.toISOString(),
      consentVersion: attempt.consentVersion,
      startedAt: attempt.startedAt.toISOString(),
      finishedAt: this.toIso(attempt.finishedAt),
      expiresAt: this.toIso(attempt.expiresAt),
      answers: attempt.answers.map((answer) => ({
        questionId: answer.questionId,
        questionType: answer.questionTypeSnapshot,
        questionTitle: answer.questionTitleSnapshot,
        answerPayload: answer.answerPayload,
        updatedAt: answer.updatedAt.toISOString(),
      })),
      analysis: attempt.analysis
        ? {
            providerMode: attempt.analysis.providerMode,
            status: attempt.analysis.status,
            summary: attempt.analysis.summary,
            rawText: attempt.analysis.rawText,
            errorMessage: attempt.analysis.errorMessage,
            generatedAt: this.toIso(attempt.analysis.generatedAt),
          }
        : null,
    };
  }
}
