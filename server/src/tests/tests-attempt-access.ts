import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { attemptWithSessionInclude, type AttemptWithSessionData } from './tests-attempt.query';

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

  const now = new Date();

  if (attempt.status === 'IN_PROGRESS' && attempt.expiresAt && now > attempt.expiresAt) {
    return prisma.testStudentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'EXPIRED',
        finishedAt: attempt.finishedAt ?? now,
      },
      include: attemptWithSessionInclude,
    });
  }

  return attempt;
};
