import type { GroupValidationMode } from '@/shared/lib/group-validation';

export type PublicLinkEntryProfileMode = 'DEMOGRAPHIC' | 'EDUCATION' | 'EDUCATION_DEMOGRAPHIC';
export type PublicLinkTemplate = 'STANDARD' | 'POLUS';

export interface TopicOption {
  id: number;
  draftTitle: string;
}

export interface EducationOrganizationOption {
  id: number;
  name: string;
  isActive: boolean;
}

export interface PublicLinkCreateCardProps {
  topics: TopicOption[];
  educationOrganizations: EducationOrganizationOption[];
  effectiveSelectedTopicId: number;
  onSelectTopic: (topicId: number) => void;
  newEducationOrganizationId: number | null;
  onEducationOrganizationSelect: (organizationId: number | null) => void;
  newEducationOrganizationName: string;
  onEducationOrganizationNameChange: (value: string) => void;
  groupValidationMode: GroupValidationMode;
  onGroupValidationModeChange: (value: GroupValidationMode) => void;
  groupValidationPattern: string;
  onGroupValidationPatternChange: (value: string) => void;
  groupValidationExample: string;
  onGroupValidationExampleChange: (value: string) => void;
  groupValidationHint: string;
  onGroupValidationHintChange: (value: string) => void;
  onCreateEducationOrganization: () => void;
  onUpdateEducationOrganization: () => void;
  isCreatingEducationOrganization: boolean;
  isUpdatingEducationOrganization: boolean;
  newPublicShortCode: string;
  onShortCodeChange: (value: string) => void;
  newPublicTemplate: PublicLinkTemplate;
  onPublicTemplateChange: (value: PublicLinkTemplate) => void;
  newPublicEntryProfileMode: PublicLinkEntryProfileMode;
  onEntryProfileModeChange: (value: PublicLinkEntryProfileMode) => void;
  newPublicMaxAttempts: string;
  onMaxAttemptsChange: (value: string) => void;
  newPublicTimeLimit: string;
  onTimeLimitChange: (value: string) => void;
  newPublicConsentVersion: string;
  onConsentVersionChange: (value: string) => void;
  newPublicConsentText: string;
  onConsentTextChange: (value: string) => void;
  newPublicAllowResume: boolean;
  onAllowResumeChange: (checked: boolean) => void;
  onCreatePublicLink: () => void;
  isCreatingPublicLink: boolean;
  hasPublishedVersion: boolean;
}

export interface PublicLinkTopicSectionProps {
  topics: TopicOption[];
  effectiveSelectedTopicId: number;
  onSelectTopic: (topicId: number) => void;
}

export interface PublicLinkOrganizationSectionProps {
  educationOrganizations: EducationOrganizationOption[];
  newEducationOrganizationId: number | null;
  onEducationOrganizationSelect: (organizationId: number | null) => void;
  newEducationOrganizationName: string;
  onEducationOrganizationNameChange: (value: string) => void;
  groupValidationMode: GroupValidationMode;
  onGroupValidationModeChange: (value: GroupValidationMode) => void;
  groupValidationPattern: string;
  onGroupValidationPatternChange: (value: string) => void;
  groupValidationExample: string;
  onGroupValidationExampleChange: (value: string) => void;
  groupValidationHint: string;
  onGroupValidationHintChange: (value: string) => void;
  onCreateEducationOrganization: () => void;
  onUpdateEducationOrganization: () => void;
  isCreatingEducationOrganization: boolean;
  isUpdatingEducationOrganization: boolean;
}

export interface PublicLinkAccessSettingsSectionProps {
  newPublicShortCode: string;
  onShortCodeChange: (value: string) => void;
  newPublicTemplate: PublicLinkTemplate;
  onPublicTemplateChange: (value: PublicLinkTemplate) => void;
  newPublicEntryProfileMode: PublicLinkEntryProfileMode;
  onEntryProfileModeChange: (value: PublicLinkEntryProfileMode) => void;
  newPublicMaxAttempts: string;
  onMaxAttemptsChange: (value: string) => void;
  newPublicTimeLimit: string;
  onTimeLimitChange: (value: string) => void;
  newPublicConsentVersion: string;
  onConsentVersionChange: (value: string) => void;
  newPublicConsentText: string;
  onConsentTextChange: (value: string) => void;
  newPublicAllowResume: boolean;
  onAllowResumeChange: (checked: boolean) => void;
}
