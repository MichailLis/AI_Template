import { BadRequestException, Injectable } from '@nestjs/common';

import { PrivacyPolicySettingsService } from '../app-settings/privacy-policy-settings.service';
import { PrismaService } from '../prisma.service';
import { createRandomToken } from './tests-domain.utils';
import {
  PUBLIC_OPERATOR_FULL_NAME,
  PUBLIC_PRIVACY_POLICY_URL,
} from './tests-personal-data-operator';
import type { AccessiblePublicLink, AttemptAllocationInput } from './tests-public-session.types';

type AttemptAllocationClient = Pick<PrismaService, 'testStudentAttempt'>;

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

  async allocate(input: AttemptAllocationInput): Promise<{ resumeToken: string }> {
    for (let attemptIndex = 0; attemptIndex < 2; attemptIndex += 1) {
      try {
        return await this.prisma.$transaction((tx) => this.allocateInTransaction(tx, input));
      } catch (error) {
        if (!isAttemptNumberRaceError(error)) {
          throw error;
        }
      }
    }

    throw new BadRequestException('Не удалось начать попытку. Попробуйте ещё раз.');
  }

  private async allocateInTransaction(
    client: AttemptAllocationClient,
    input: AttemptAllocationInput,
  ) {
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
