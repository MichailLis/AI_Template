import type { PublicLinkAdminRecord } from './tests-public-link.query';

export const toOptionalIsoString = (value: Date | null) => {
  return value ? value.toISOString() : null;
};

export const mapAdminPublicLink = (link: PublicLinkAdminRecord) => {
  return {
    id: link.id,
    publishedVersionId: link.topicVersion.id,
    topicId: link.topicVersion.topicId,
    shortCode: link.shortCode,
    shortUrl: `/t/${link.shortCode}`,
    isActive: link.isActive,
    archivedAt: toOptionalIsoString(link.archivedAt),
    startsAt: toOptionalIsoString(link.startsAt),
    endsAt: toOptionalIsoString(link.endsAt),
    maxAttemptsPerStudent: link.maxAttemptsPerStudent,
    timeLimitMinutes: link.timeLimitMinutes,
    allowResume: link.allowResume,
    consentVersion: link.consentVersion,
    consentText: link.consentTextSnapshot,
    title: link.topicVersion.title,
    updatedAt: link.updatedAt.toISOString(),
    createdAt: link.createdAt.toISOString(),
  };
};
