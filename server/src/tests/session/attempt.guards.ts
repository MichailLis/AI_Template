import { BadRequestException } from '@nestjs/common';

interface AttemptState {
  status: string;
  expiresAt: Date | null;
}

export const ensureAttemptCanAcceptAnswers = (attempt: AttemptState) => {
  if (attempt.status !== 'IN_PROGRESS') {
    throw new BadRequestException('Test session is not active', 'SESSION_NOT_ACTIVE');
  }

  if (attempt.expiresAt && new Date() > attempt.expiresAt) {
    throw new BadRequestException('Test session expired', 'SESSION_EXPIRED');
  }
};
