import type { UseFormReturn } from 'react-hook-form';

export type PublicLinkEntryProfileMode = 'DEMOGRAPHIC' | 'EDUCATION' | 'EDUCATION_DEMOGRAPHIC';
export type PublicLinkTemplate = 'STANDARD' | 'POLUS';
export type PersonalDataProcessingMode = 'PUBLIC' | 'ON_BEHALF_OF_EDUCATION_ORGANIZATION';

export interface TopicOption {
  id: number;
  draftTitle: string;
  /** Ссылку можно создать только на опубликованный тест. */
  publishedVersionNumber: number | null;
}

export interface EducationOrganizationOption {
  id: number;
  name: string;
  isActive: boolean;
  personalDataReady: boolean;
}

/** Поля создаваемой ссылки. Числа остаются строками до validateCreatePublicLinkInput. */
export interface CreatePublicLinkValues {
  shortCode: string;
  educationOrganizationId: number | null;
  personalDataProcessingMode: PersonalDataProcessingMode;
  publicTemplate: PublicLinkTemplate;
  entryProfileMode: PublicLinkEntryProfileMode;
  maxAttempts: string;
  timeLimit: string;
  allowResume: boolean;
  consentVersion: string;
  consentText: string;
}

export type CreatePublicLinkForm = UseFormReturn<CreatePublicLinkValues>;

export interface PublicLinkCreateCardProps {
  form: CreatePublicLinkForm;
  topics: TopicOption[];
  educationOrganizations: EducationOrganizationOption[];
  effectiveSelectedTopicId: number;
  onSelectTopic: (topicId: number) => void;
  onCreateEducationOrganization: () => void;
  onEditEducationOrganization: () => void;
  onCreatePublicLink: () => void;
  isCreatingPublicLink: boolean;
  hasPublishedVersion: boolean;
  /** Ошибка последней попытки создания: остается на форме, пока пользователь ее не исправит. */
  createError?: string | null;
}

export interface PublicLinkTopicSectionProps {
  topics: TopicOption[];
  effectiveSelectedTopicId: number;
  onSelectTopic: (topicId: number) => void;
}

export interface PublicLinkOrganizationSectionProps {
  form: CreatePublicLinkForm;
  educationOrganizations: EducationOrganizationOption[];
  onCreateEducationOrganization: () => void;
  onEditEducationOrganization: () => void;
}

export interface PublicLinkAccessSettingsSectionProps {
  form: CreatePublicLinkForm;
}
