import type { PublicLinkAdminRecord } from '../public-links/public-link.query';
import { toOptionalIsoString } from '../shared/date.utils';
import { toPublicBrandingResponse } from '../shared/public-branding.utils';

export const mapAdminPublicLink = (link: PublicLinkAdminRecord) => {
  return {
    id: link.id,
    publishedVersionId: link.topicVersion.id,
    topicVersionNumber: link.topicVersion.versionNumber,
    activePublishedVersionId: link.topicVersion.topic.activePublishedVersion?.id ?? null,
    activePublishedVersionNumber:
      link.topicVersion.topic.activePublishedVersion?.versionNumber ?? null,
    topicId: link.topicVersion.topicId,
    educationOrganizationId: link.educationOrganization?.id ?? null,
    educationOrganizationName: link.educationOrganization?.name ?? null,
    educationOrganizationIsActive: link.educationOrganization?.isActive ?? null,
    personalDataProcessingMode: link.personalDataProcessingMode,
    operatorFullNameSnapshot: link.operatorFullNameSnapshot,
    operatorShortNameSnapshot: link.operatorShortNameSnapshot,
    operatorPrivacyPolicyUrlSnapshot: link.operatorPrivacyPolicyUrlSnapshot,
    operatorConsentDocumentUrlSnapshot: link.operatorConsentDocumentUrlSnapshot,
    entryProfileMode: link.entryProfileMode,
    publicTemplate: link.publicTemplate,
    publicBranding: toPublicBrandingResponse(link.publicBranding),
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
    topicArchivedAt: toOptionalIsoString(link.topicVersion.topic.archivedAt),
    updatedAt: link.updatedAt.toISOString(),
    createdAt: link.createdAt.toISOString(),
  };
};
