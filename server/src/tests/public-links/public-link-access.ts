import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { TestTopicVersionStatus } from '@prisma/client';

type PublicLinkAccessState = {
  archivedAt: Date | null;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  educationOrganization?: {
    isActive: boolean;
  } | null;
};

type PublicLinkTopicVersionAccessState = {
  status: TestTopicVersionStatus;
  topic: {
    archivedAt: Date | null;
  };
};

export const ensurePublicLinkAccessible = (
  link: PublicLinkAccessState,
  topicVersion: PublicLinkTopicVersionAccessState,
) => {
  if (link.archivedAt) {
    throw new NotFoundException('Public test link not found');
  }

  if (topicVersion.topic.archivedAt) {
    throw new BadRequestException('Public test link is disabled because its test is archived');
  }

  if (link.educationOrganization && !link.educationOrganization.isActive) {
    throw new BadRequestException(
      'Public test link is disabled because its education organization is disabled',
    );
  }

  if (!link.isActive) {
    throw new BadRequestException('Public test link is disabled');
  }

  if (topicVersion.status === 'DRAFT') {
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
