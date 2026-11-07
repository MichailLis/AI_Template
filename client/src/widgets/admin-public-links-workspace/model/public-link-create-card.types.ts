import type { CreatePublicLinkValues } from '@/features/manage-public-link';
import type { UseFormReturn } from 'react-hook-form';

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
  /** Сообщает false, пока в поле окна доступа незавершенный ввод: создать ссылку нельзя. */
  onAccessWindowDraftValidityChange?: (isValid: boolean) => void;
}
