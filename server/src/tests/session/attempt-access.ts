import { NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../../prisma.service';
import { attemptWithSessionInclude, type AttemptWithSessionData } from '../attempts/attempt.query';
import { ensurePublicLinkAccessible } from '../public-links/public-link-access';

const findSessionAttemptByTokenOrThrow = async (
  prisma: PrismaService,
  sessionToken: string,
): Promise<AttemptWithSessionData> => {
  const attempt = await prisma.testStudentAttempt.findUnique({
    where: { resumeToken: sessionToken },
    include: attemptWithSessionInclude,
  });

  if (!attempt) {
    throw new NotFoundException('Test session not found', 'SESSION_NOT_FOUND');
  }

  return attempt;
};

export const getSessionAttemptByTokenOrThrow = async (
  prisma: PrismaService,
  sessionToken: string,
): Promise<AttemptWithSessionData> => {
  const attempt = await findSessionAttemptByTokenOrThrow(prisma, sessionToken);

  ensurePublicLinkAccessible(attempt.publicLink, attempt.topicVersion);

  return attempt;
};

/**
 * Решение владельца по #128: ученик, который уже прошёл тест, видит результат, пока ссылку не
 * удалили. Срок ссылки, её отключение, архивация теста и отключение учебного заведения закрывают
 * только вход, ответы и finish.
 */
export const getResultAttemptByTokenOrThrow = async (
  prisma: PrismaService,
  sessionToken: string,
): Promise<AttemptWithSessionData> => {
  const attempt = await findSessionAttemptByTokenOrThrow(prisma, sessionToken);

  if (attempt.publicLink.archivedAt) {
    throw new NotFoundException('Public test link not found', 'LINK_NOT_FOUND');
  }

  return attempt;
};
