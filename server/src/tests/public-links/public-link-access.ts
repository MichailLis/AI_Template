import type { TestTopicVersionStatus } from '@prisma/client';

import { InvalidInputError, NotFoundError } from '../../common/errors/domain-error';

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
    throw new NotFoundError('Public test link not found', 'LINK_NOT_FOUND');
  }

  if (topicVersion.topic.archivedAt) {
    throw new InvalidInputError(
      'Public test link is disabled because its test is archived',
      'LINK_DISABLED',
    );
  }

  if (link.educationOrganization && !link.educationOrganization.isActive) {
    throw new InvalidInputError(
      'Public test link is disabled because its education organization is disabled',
      'LINK_DISABLED',
    );
  }

  if (!link.isActive) {
    throw new InvalidInputError('Public test link is disabled', 'LINK_DISABLED');
  }

  if (topicVersion.status === 'DRAFT') {
    throw new InvalidInputError('Public test link points to draft test version', 'LINK_DISABLED');
  }

  const now = new Date();

  if (link.startsAt && now < link.startsAt) {
    throw new InvalidInputError('Public test link is not active yet', 'LINK_NOT_STARTED');
  }

  if (link.endsAt && now > link.endsAt) {
    throw new InvalidInputError('Public test link has expired', 'LINK_EXPIRED');
  }
};
