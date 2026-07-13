import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { TestTopicVersionStatus } from '@prisma/client';

type PublicLinkAccessState = {
  archivedAt: Date | null;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
};

export const ensurePublicLinkAccessible = (
  link: PublicLinkAccessState,
  topicVersionStatus: TestTopicVersionStatus,
) => {
  if (link.archivedAt) {
    throw new NotFoundException('Public test link not found');
  }

  if (!link.isActive) {
    throw new BadRequestException('Public test link is disabled');
  }

  if (topicVersionStatus === 'DRAFT') {
    throw new BadRequestException('Public test link points to draft test version');
  }

  const now = new Date();

  if (link.startsAt && now < link.startsAt) {
    throw new BadRequestException('Public test link is not active yet');
  }

  if (link.endsAt && now > link.endsAt) {
    throw new BadRequestException('Public test link has expired');
  }
};
