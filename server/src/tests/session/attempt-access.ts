import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma.service';
import { attemptWithSessionInclude, type AttemptWithSessionData } from '../attempts/attempt.query';
import { ensurePublicLinkAccessible } from '../public-links/public-link-access';

export const getSessionAttemptByTokenOrThrow = async (
  prisma: PrismaService,
  sessionToken: string,
): Promise<AttemptWithSessionData> => {
  const attempt = await prisma.testStudentAttempt.findUnique({
    where: { resumeToken: sessionToken },
    include: attemptWithSessionInclude,
  });

  if (!attempt) {
    throw new NotFoundException('Test session not found');
  }

  ensurePublicLinkAccessible(attempt.publicLink, attempt.topicVersion.status);

  return attempt;
};
