import { BadRequestException, Injectable } from '@nestjs/common';

import { PrivacyPolicySettingsService } from '../../app-settings/privacy-policy-settings.service';
import { PrismaService } from '../../prisma.service';
import { createRandomToken } from '../shared/domain.utils';
import {
  PUBLIC_OPERATOR_FULL_NAME,
  PUBLIC_PRIVACY_POLICY_URL,
} from '../shared/personal-data-operator';

import type { AccessiblePublicLink, DemographicProfile } from '../session/session-profile';

/**
 * Allocating an attempt for a returning student: expire whatever has run out, resume an attempt
 * that is still open, refuse once the link's limit is reached, and otherwise create the next one.
 *
 * It lives apart from TestsPublicSessionService because it is the only part of starting a session
 * that runs inside a transaction and races with itself. Two students submitting the same link at
 * once collide on (publicLinkId, studentKeyHash, attemptNumber); the unique constraint is what
 * makes that safe, and the retry below is what makes it invisible.
 */
export type AttemptProfileSnapshot = {
  studentName: string | null;
  studentLastInitial: string | null;
  studentMiddleInitial: string | null;
  educationOrganization: string | null;
  groupOrClass: string | null;
  studentGender: DemographicProfile['studentGender'] | null;
  studentAge: number | null;
  studentResidence: string | null;
  studentEducationLevel: DemographicProfile['studentEducationLevel'] | null;
};

export type AttemptAllocationInput = {
  link: AccessiblePublicLink;
  studentKeyHash: string;
  profile: AttemptProfileSnapshot;
};

export type AttemptAllocationClient = Pick<PrismaService, 'testStudentAttempt'>;

const toAttemptOperatorSnapshot = (link: AccessiblePublicLink) => {
  const isPublicProcessing = link.personalDataProcessingMode === 'PUBLIC';

  return {
    operatorEducationOrganizationId: isPublicProcessing ? null : link.educationOrganizationId,
    operatorFullNameSnapshot: isPublicProcessing
      ? (link.operatorFullNameSnapshot ?? PUBLIC_OPERATOR_FULL_NAME)
      : link.operatorFullNameSnapshot,
    operatorShortNameSnapshot: link.operatorShortNameSnapshot,
    operatorPrivacyPolicyUrlSnapshot: isPublicProcessing
      ? (link.operatorPrivacyPolicyUrlSnapshot ?? PUBLIC_PRIVACY_POLICY_URL)
      : link.operatorPrivacyPolicyUrlSnapshot,
    operatorConsentDocumentUrlSnapshot: link.operatorConsentDocumentUrlSnapshot,
  };
};

const isAttemptNumberRaceError = (error: unknown) => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const prismaError = error as { code?: unknown; meta?: { target?: unknown } };
  const target = prismaError.meta?.target;

  return (
    prismaError.code === 'P2002' &&
    Array.isArray(target) &&
    ['publicLinkId', 'studentKeyHash', 'attemptNumber'].every((field) => target.includes(field))
  );
};

@Injectable()
export class TestsPublicAttemptAllocationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privacyPolicySettingsService: PrivacyPolicySettingsService,
  ) {}

  /**
   * Returns the resume token of the attempt the student should continue in, creating one if
   * needed. Retried once: a P2002 on the attempt-number constraint means another request won
   * the race, and reading the attempt list again resolves it.
   */
  async allocate(input: AttemptAllocationInput): Promise<{ resumeToken: string }> {
    for (let attemptIndex = 0; attemptIndex < 2; attemptIndex += 1) {
      try {
        return await this.prisma.$transaction((tx) => this.allocateAttempt(tx, input));
      } catch (error) {
        if (!isAttemptNumberRaceError(error)) {
          throw error;
        }
      }
    }

    throw new BadRequestException('Не удалось начать попытку. Попробуйте ещё раз.');
  }

  private async allocateAttempt(client: AttemptAllocationClient, input: AttemptAllocationInput) {
    const { link, profile, studentKeyHash } = input;
    const now = new Date();

    await client.testStudentAttempt.updateMany({
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

    const previousAttempts = await client.testStudentAttempt.findMany({
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

    if (link.allowResume && link.entryProfileMode !== 'DEMOGRAPHIC') {
      const resumableAttempt = previousAttempts.find(
        (attempt) =>
          attempt.status === 'IN_PROGRESS' &&
          (!attempt.expiresAt || attempt.expiresAt.getTime() > now.getTime()),
      );

      if (resumableAttempt) {
        return { resumeToken: resumableAttempt.resumeToken };
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
    const activePolicy = await this.privacyPolicySettingsService.getActivePolicySnapshot();
    const createdAttempt = await client.testStudentAttempt.create({
      data: {
        publicLinkId: link.id,
        topicVersionId: link.topicVersionId,
        attemptNumber: nextAttemptNumber,
        status: 'IN_PROGRESS',
        ...profile,
        studentKeyHash,
        consentAcceptedAt: now,
        consentVersion: link.consentVersion,
        consentTextSnapshot: link.consentTextSnapshot,
        policyVersionSnapshot: activePolicy.version,
        policyPublishedAtSnapshot: activePolicy.publishedAt,
        ...toAttemptOperatorSnapshot(link),
        resumeToken: createRandomToken(24),
        startedAt: now,
        expiresAt,
      },
    });

    return { resumeToken: createdAttempt.resumeToken };
  }
}
