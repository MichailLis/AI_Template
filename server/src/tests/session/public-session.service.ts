import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma.service';
import type {
  PublicSessionSaveAnswersRequestDto,
  PublicSessionStartRequestDto,
} from '../dto/tests-public.dto';
import { mapSessionState } from '../attempts/attempt.mapper';
import { getSessionAttemptByTokenOrThrow } from '../session/attempt-access';
import { ensureAttemptCanAcceptAnswers } from '../session/attempt.guards';
import { toOptionalIsoString } from '../shared/date.utils';
import {
  buildDemographicStudentKeyHash,
  buildEducationDemographicStudentKeyHash,
  buildStudentKeyHash,
  toPrismaRequiredJsonInput,
} from '../shared/domain.utils';
import { PrivacyPolicySettingsService } from '../../app-settings/privacy-policy-settings.service';
import { ProfessionAtlasSettingsService } from '../../app-settings/profession-atlas-settings.service';
import {
  ProfOrientationAtlasService,
  shouldRefreshProfOrientationAtlasSummary,
} from '../prof-orientation-v3-plus/atlas';
import { isProfOrientationV3PlusSummary } from '../prof-orientation-v3-plus/scoring';
import { TestsAnalysisService } from '../analysis/analysis.service';
import {
  validatePublicAnswerPayload,
  validatePublicAttemptAnswersForFinish,
} from '../session/answer-validation';
import { TestsPublicLinkService } from '../public-links/public-link.service';
import {
  resolveDemographicProfile,
  normalizeRequiredString,
  validateEntryProfileMode,
  validateGroupOrClassForLink,
} from '../session/session-profile';

import { TestsPublicAttemptAllocationService } from '../session/attempt-allocation.service';

import type { AccessiblePublicLink } from '../session/session-profile';
import type { AttemptAllocationInput } from '../session/attempt-allocation.service';
import { toPublicBrandingResponse } from '../shared/public-branding.utils';

export type SessionStateResponse = {
  session: ReturnType<typeof mapSessionState>;
};

@Injectable()
export class TestsPublicSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publicLinkService: TestsPublicLinkService,
    private readonly analysisService: TestsAnalysisService,
    private readonly privacyPolicySettingsService: PrivacyPolicySettingsService,
    private readonly professionAtlasSettingsService: ProfessionAtlasSettingsService,
    private readonly profOrientationAtlasService: ProfOrientationAtlasService,
    private readonly attemptAllocationService: TestsPublicAttemptAllocationService,
  ) {}

  private toSessionResultAnalysisResponse(
    status: ReturnType<TestsAnalysisService['toAttemptStatus']>,
    analysis: Parameters<TestsAnalysisService['toPublicAnalysisResponse']>[0],
  ) {
    if (status === 'EXPIRED' && !analysis) {
      return {
        providerMode: 'STUB' as const,
        status: 'FAILED' as const,
        summary: null,
        errorMessage: 'Test session expired before completion',
        generatedAt: null,
      };
    }

    return this.analysisService.toPublicAnalysisResponse(analysis);
  }

  private async refreshStaleProfOrientationAtlasAnalysis(
    analysis: Parameters<TestsAnalysisService['toPublicAnalysisResponse']>[0],
  ) {
    if (
      !analysis ||
      !isProfOrientationV3PlusSummary(analysis.summary) ||
      !shouldRefreshProfOrientationAtlasSummary(analysis.summary)
    ) {
      return analysis;
    }

    const summary = await this.profOrientationAtlasService.saveEnrichedAnalysis(
      analysis.id,
      analysis.summary,
    );

    return {
      ...analysis,
      summary: summary as unknown as typeof analysis.summary,
      rawText: JSON.stringify(summary),
    };
  }

  private async startAllocatedSession(
    input: AttemptAllocationInput,
  ): Promise<SessionStateResponse> {
    const allocatedAttempt = await this.attemptAllocationService.allocate(input);

    return this.getSessionByToken(allocatedAttempt.resumeToken);
  }

  async startSessionByCode(
    shortCode: string,
    dto: PublicSessionStartRequestDto,
  ): Promise<SessionStateResponse> {
    const link = await this.publicLinkService.getAccessiblePublicLinkByCode(shortCode);
    validateEntryProfileMode(link, dto);

    if (link.entryProfileMode === 'DEMOGRAPHIC') {
      return this.startDemographicSession(link, dto);
    }

    const isEducationDemographicMode = link.entryProfileMode === 'EDUCATION_DEMOGRAPHIC';
    const resolvedEducationOrganization =
      link.educationOrganization?.name ??
      normalizeRequiredString(
        dto.educationOrganization,
        'Учебное заведение обязательно для начала теста',
      );
    const studentName = normalizeRequiredString(dto.studentName, 'Укажите имя участника');
    const normalizedGroupOrClass = normalizeRequiredString(
      dto.groupOrClass,
      'Укажите группу или класс',
    );
    const demographicProfile = isEducationDemographicMode ? resolveDemographicProfile(dto) : null;
    let studentLastInitial: string | null = null;
    let studentMiddleInitial: string | null = null;
    let studentKeyHash: string;

    if (demographicProfile) {
      studentKeyHash = buildEducationDemographicStudentKeyHash({
        studentName,
        studentAge: demographicProfile.studentAge,
        educationOrganization: resolvedEducationOrganization,
        groupOrClass: normalizedGroupOrClass,
      });
    } else {
      studentLastInitial = normalizeRequiredString(
        dto.studentLastInitial,
        'Укажите первую букву фамилии',
      );
      studentMiddleInitial = normalizeRequiredString(
        dto.studentMiddleInitial,
        'Укажите первую букву отчества',
      );
      studentKeyHash = buildStudentKeyHash({
        studentName,
        studentLastInitial,
        studentMiddleInitial,
        educationOrganization: resolvedEducationOrganization,
        groupOrClass: normalizedGroupOrClass,
      });
    }

    validateGroupOrClassForLink(normalizedGroupOrClass, link);

    return this.startAllocatedSession({
      link,
      studentKeyHash,
      profile: {
        studentName,
        studentLastInitial,
        studentMiddleInitial,
        educationOrganization: resolvedEducationOrganization,
        groupOrClass: normalizedGroupOrClass,
        studentGender: demographicProfile?.studentGender ?? null,
        studentAge: demographicProfile?.studentAge ?? null,
        studentResidence: demographicProfile?.studentResidence ?? null,
        studentEducationLevel: demographicProfile?.studentEducationLevel ?? null,
      },
    });
  }

  private async startDemographicSession(
    link: AccessiblePublicLink,
    dto: PublicSessionStartRequestDto,
  ): Promise<SessionStateResponse> {
    const demographicProfile = resolveDemographicProfile(dto);

    return this.startAllocatedSession({
      link,
      studentKeyHash: buildDemographicStudentKeyHash({
        publicLinkId: link.id,
        ...demographicProfile,
      }),
      profile: {
        studentName: null,
        studentLastInitial: null,
        studentMiddleInitial: null,
        educationOrganization: null,
        groupOrClass: null,
        studentGender: demographicProfile.studentGender,
        studentAge: demographicProfile.studentAge,
        studentResidence: demographicProfile.studentResidence,
        studentEducationLevel: demographicProfile.studentEducationLevel,
      },
    });
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

    const validatedAnswers = dto.answers.map((answer) => {
      const question = questionMap.get(answer.questionId);
      if (!question) {
        throw new BadRequestException(
          `Question ${answer.questionId} does not belong to this session`,
        );
      }

      return {
        questionId: answer.questionId,
        answerPayload: validatePublicAnswerPayload(question, answer.answerPayload),
      };
    });

    const answers = await this.prisma.$transaction(async (tx) => {
      for (const answer of validatedAnswers) {
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

    if (attempt.status === 'COMPLETED') {
      return {
        sessionToken,
        status: 'COMPLETED',
        finishedAt: toOptionalIsoString(attempt.finishedAt),
        analysis: this.analysisService.toPublicAnalysisResponse(attempt.analysis),
      };
    }

    ensureAttemptCanAcceptAnswers(attempt);
    validatePublicAttemptAnswersForFinish(attempt.topicVersion.questions, attempt.answers);

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

      const promptVersionId = attempt.topicVersion.analysisPromptVersionId;
      const isProfOrientationScoring =
        attempt.topicVersion.scoringKind === 'PROF_ORIENTATION_V3_PLUS';
      const analysis = isProfOrientationScoring
        ? await this.analysisService.upsertProfOrientationV3PlusAnalysis(tx, {
            attempt,
            promptVersionId,
          })
        : promptVersionId
          ? await this.analysisService.upsertPendingLlmAnalysis(tx, {
              attemptId: attempt.id,
              promptVersionId,
            })
          : await this.analysisService.upsertStubAnalysis(tx, {
              attemptId: attempt.id,
              answeredQuestionsCount: answersCount,
              totalQuestionsCount: attempt.topicVersion.questions.length,
            });

      return {
        updatedAttempt,
        analysis,
        isProfOrientationScoring,
        shouldEnqueueAnalysis: Boolean(promptVersionId),
      };
    });

    let analysis = finishedAttempt.analysis;

    if (
      finishedAttempt.isProfOrientationScoring &&
      isProfOrientationV3PlusSummary(analysis.summary)
    ) {
      const enrichedSummary = await this.profOrientationAtlasService.saveEnrichedAnalysis(
        analysis.id,
        analysis.summary,
      );

      analysis = {
        ...analysis,
        summary: enrichedSummary as unknown as typeof analysis.summary,
        rawText: JSON.stringify(enrichedSummary),
      };
    }

    if (finishedAttempt.shouldEnqueueAnalysis) {
      this.analysisService.enqueueAttemptAnalysis(attempt.id);
    }

    return {
      sessionToken,
      status: 'COMPLETED',
      finishedAt: toOptionalIsoString(finishedAttempt.updatedAttempt.finishedAt),
      analysis: this.analysisService.toPublicAnalysisResponse(analysis),
    };
  }

  async getSessionResult(sessionToken: string) {
    const attempt = await getSessionAttemptByTokenOrThrow(this.prisma, sessionToken);
    const status = this.analysisService.toAttemptStatus(attempt);

    if (status === 'IN_PROGRESS') {
      throw new BadRequestException('Test session is still in progress');
    }

    const analysis = await this.refreshStaleProfOrientationAtlasAnalysis(attempt.analysis);

    return {
      sessionToken,
      publicTemplate: attempt.publicLink.publicTemplate,
      publicBranding: toPublicBrandingResponse(attempt.publicLink.publicBranding),
      status,
      finishedAt: toOptionalIsoString(attempt.finishedAt),
      analysis: this.toSessionResultAnalysisResponse(status, analysis),
      professionAtlasUrl: await this.professionAtlasSettingsService.getProfessionAtlasUrl(),
    };
  }
}
