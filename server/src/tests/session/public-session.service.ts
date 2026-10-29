import { BadRequestException, Injectable } from '@nestjs/common';
import { isDeepStrictEqual } from 'node:util';

import { PrismaService } from '../../prisma.service';
import type {
  PublicSessionSaveAnswersRequestDto,
  PublicSessionStartRequestDto,
} from '../dto/tests-public.dto';
import { mapSessionState } from '../attempts/attempt.mapper';
import {
  getResultAttemptByTokenOrThrow,
  getSessionAttemptByTokenOrThrow,
} from '../session/attempt-access';
import { ensureAttemptCanAcceptAnswers } from '../session/attempt.guards';
import { toOptionalIsoString } from '../shared/date.utils';
import {
  buildEducationDemographicStudentKeyHash,
  buildStudentKeyHash,
  createRandomToken,
  toPrismaRequiredJsonInput,
} from '../shared/domain.utils';
import { PrivacyPolicySettingsService } from '../../app-settings/privacy-policy-settings.service';
import { ProfessionAtlasSettingsService } from '../../app-settings/profession-atlas-settings.service';
import { ProfOrientationAtlasService } from '../prof-orientation-v3-plus/atlas';
import { shouldRefreshProfOrientationAtlasSummary } from '../prof-orientation-v3-plus/atlas.logic';
import { isProfOrientationV3PlusSummary } from '../prof-orientation-v3-plus/scoring';
import { TestsAnalysisService } from '../analysis/analysis.service';
import { getPlannedAnalysisKind } from '../analysis/analysis-result-kind';
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

const isRecordNotFoundError = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025';

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
    let studentLastInitial: string | null;
    let studentMiddleInitial: string | null;
    let studentKeyHash: string;

    if (demographicProfile) {
      studentLastInitial = dto.studentLastInitial?.trim() || null;
      studentMiddleInitial = dto.studentMiddleInitial?.trim() || null;
      studentKeyHash = buildEducationDemographicStudentKeyHash({
        studentName,
        studentAge: demographicProfile.studentAge,
        educationOrganization: resolvedEducationOrganization,
        groupOrClass: normalizedGroupOrClass,
        studentLastInitial,
        studentMiddleInitial,
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
      // Anonymous: nobody can be recognised, so every start is a new participant. A profile match
      // must never decide who gets which resume token (see 590fe89).
      studentKeyHash: createRandomToken(32),
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
        answerPayload:
          answer.answerPayload === null
            ? null
            : validatePublicAnswerPayload(question, answer.answerPayload),
      };
    });

    // Пишем только изменённое: автосохранение шлёт все ответы, а чужие правки из другой вкладки
    // не должны перезаписываться теми же значениями. Порядок в мультивыборе считается изменением.
    const storedPayloads = new Map(attempt.answers.map((a) => [a.questionId, a.answerPayload]));
    const changedAnswers = validatedAnswers.filter((answer) =>
      answer.answerPayload === null
        ? storedPayloads.has(answer.questionId)
        : !isDeepStrictEqual(storedPayloads.get(answer.questionId), answer.answerPayload),
    );

    const answers = await this.prisma.$transaction(async (tx) => {
      for (const answer of changedAnswers) {
        if (answer.answerPayload === null) {
          await tx.testStudentAnswer.deleteMany({
            where: { attemptId: attempt.id, questionId: answer.questionId },
          });
          continue;
        }

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
      return this.toCompletedResponse(sessionToken, attempt);
    }

    ensureAttemptCanAcceptAnswers(attempt);
    validatePublicAttemptAnswersForFinish(attempt.topicVersion.questions, attempt.answers);

    const finishedAttempt = await this.prisma.$transaction(async (tx) => {
      // Only the request that flips IN_PROGRESS -> COMPLETED continues; a concurrent duplicate gets
      // P2025 here and must not write a second analysis or enqueue a second LLM run.
      const updatedAttempt = await tx.testStudentAttempt
        .update({
          where: {
            id: attempt.id,
            status: 'IN_PROGRESS',
          },
          data: {
            status: 'COMPLETED',
            finishedAt: new Date(),
          },
        })
        .catch((error: unknown) => {
          if (isRecordNotFoundError(error)) {
            return null;
          }
          throw error;
        });

      if (!updatedAttempt) {
        return null;
      }

      const answersCount = await tx.testStudentAnswer.count({
        where: {
          attemptId: attempt.id,
        },
      });

      const promptVersionId = attempt.topicVersion.analysisPromptVersionId;
      const plannedKind = getPlannedAnalysisKind(attempt.topicVersion);
      const isProfOrientationScoring =
        plannedKind === 'ALGORITHM' || plannedKind === 'ALGORITHM_AI';
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

    if (!finishedAttempt) {
      return this.toCompletedResponse(
        sessionToken,
        await getSessionAttemptByTokenOrThrow(this.prisma, sessionToken),
      );
    }

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

  private toCompletedResponse(
    sessionToken: string,
    attempt: Awaited<ReturnType<typeof getSessionAttemptByTokenOrThrow>>,
  ) {
    return {
      sessionToken,
      status: 'COMPLETED' as const,
      finishedAt: toOptionalIsoString(attempt.finishedAt),
      analysis: this.analysisService.toPublicAnalysisResponse(attempt.analysis),
    };
  }

  async getSessionResult(sessionToken: string) {
    const attempt = await getResultAttemptByTokenOrThrow(this.prisma, sessionToken);
    const status = this.analysisService.toAttemptStatus(attempt);

    if (status === 'IN_PROGRESS') {
      throw new BadRequestException('Test session is still in progress', 'SESSION_IN_PROGRESS');
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
