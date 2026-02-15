import type { PublicLinksTab } from './admin-public-links-workspace.helpers';
import type { GroupValidationMode } from '@/shared/lib/group-validation';

export interface UseAdminPublicLinksActionsParams {
  publishedVersionId: number | undefined;
  newPublicShortCode: string;
  newEducationOrganizationId: number | null;
  newEducationOrganizationName: string;
  groupValidationMode: GroupValidationMode;
  groupValidationPattern: string;
  groupValidationExample: string;
  groupValidationHint: string;
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
  setNewPublicShortCode: (value: string) => void;
  setNewEducationOrganizationId: (value: number | null) => void;
  setNewEducationOrganizationName: (value: string) => void;
  setGroupValidationMode: (value: GroupValidationMode) => void;
  setGroupValidationPattern: (value: string) => void;
  setGroupValidationExample: (value: string) => void;
  setGroupValidationHint: (value: string) => void;
  refetchPublicLinks: () => void;
  refetchEducationOrganizations: () => void;
}
