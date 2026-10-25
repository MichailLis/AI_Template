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
    throw new NotFoundException('Public test link not found', 'LINK_NOT_FOUND');
  }

  if (topicVersion.topic.archivedAt) {
    throw new BadRequestException(
      'Public test link is disabled because its test is archived',
      'LINK_DISABLED',
    );
  }

  if (link.educationOrganization && !link.educationOrganization.isActive) {
    throw new BadRequestException(
      'Public test link is disabled because its education organization is disabled',
      'LINK_DISABLED',
    );
  }

  if (!link.isActive) {
    throw new BadRequestException('Public test link is disabled', 'LINK_DISABLED');
  }

  if (topicVersion.status === 'DRAFT') {
    throw new BadRequestException('Public test link points to draft test version', 'LINK_DISABLED');
  }

  const now = new Date();

  if (link.startsAt && now < link.startsAt) {
    throw new BadRequestException('Public test link is not active yet', 'LINK_NOT_STARTED');
  }

  if (link.endsAt && now > link.endsAt) {
    throw new BadRequestException('Public test link has expired', 'LINK_EXPIRED');
  }
};
