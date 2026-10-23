import type { PublicLinksTab } from './admin-public-links-workspace.helpers';
import type {
  PublicLinkEntryProfileMode,
  PublicLinkTemplate,
  PersonalDataProcessingMode,
  EducationOrganizationOption,
} from './public-link-create-card.types';
import type { PublicLinkListItem } from './public-links-list-card.helpers';

export interface UseAdminPublicLinksActionsParams {
  publishedVersionId: number | undefined;
  newPublicShortCode: string;
  newEducationOrganizationId: number | null;
  educationOrganizations: EducationOrganizationOption[];
  newPersonalDataProcessingMode: PersonalDataProcessingMode;
  newPublicTemplate: PublicLinkTemplate;
  newPublicEntryProfileMode: PublicLinkEntryProfileMode;
  newPublicMaxAttempts: string;
  newPublicTimeLimit: string;
  newPublicAllowResume: boolean;
  newPublicConsentVersion: string;
  newPublicConsentText: string;
  pendingDeletePublicLinkId: number | null;
  selectedPublicLinkId: number | null;
  setPublicLinksTab: (tab: PublicLinksTab) => void;
  setSelectedPublicLinkId: (value: number | null) => void;
  setPendingDeletePublicLinkId: (value: number | null) => void;
  pendingMovePublicLink: PublicLinkListItem | null;
  setPendingMovePublicLink: (link: PublicLinkListItem | null) => void;
  setNewPublicShortCode: (value: string) => void;
  setNewPersonalDataProcessingMode: (value: PersonalDataProcessingMode) => void;
  refetchPublicLinks: () => void;
  onPublicLinkCreated?: () => void;
}
