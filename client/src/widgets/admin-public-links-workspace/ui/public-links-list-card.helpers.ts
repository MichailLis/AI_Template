import { formatDateTime } from '@/shared/lib/date-format';
import { getEntryProfileModeLabel, getPublicTemplateLabel } from '@/shared/lib/public-test-labels';
import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';

import type { PublicBrandingConfig } from '@/features/tests';

export interface PublicLinkListItem {
  id: number;
  shortCode: string;
  title: string;
  educationOrganizationName: string | null;
  educationOrganizationIsActive?: boolean | null;
  publicTemplate: 'STANDARD' | 'POLUS';
  publicBranding?: PublicBrandingConfig;
  entryProfileMode: 'DEMOGRAPHIC' | 'EDUCATION' | 'EDUCATION_DEMOGRAPHIC';
  createdAt: string;
  archivedAt: string | null;
  /**
   * Архив самого теста закрывает доступ по всем его ссылкам (сервер отказывает в
   * `ensurePublicLinkAccessible`), поэтому состояние ссылки нельзя вычислять по одному `isActive`.
   */
  topicArchivedAt: string | null;
  isActive: boolean;
  publishedVersionId: number;
  /** Ссылка остаётся на своей версии теста (решение ait-rcw.2), поэтому версия показывается явно. */
  topicVersionNumber: number;
  activePublishedVersionId: number | null;
  activePublishedVersionNumber: number | null;
}

export const isPublicLinkClosedForStudents = (link: PublicLinkListItem) =>
  Boolean(link.archivedAt) ||
  Boolean(link.topicArchivedAt) ||
  link.educationOrganizationIsActive === false ||
  !link.isActive;

export const getLinkStateLabel = (link: PublicLinkListItem) => {
  if (link.archivedAt) {
    return 'В архиве';
  }

  if (link.topicArchivedAt) {
    return 'Тест в архиве';
  }

  if (link.educationOrganizationIsActive === false) {
    return 'Заведение отключено';
  }

  return link.isActive ? 'Активна' : 'Отключена';
};

export const getLinkStateClassName = (link: PublicLinkListItem) => {
  if (link.archivedAt) {
    return adminBadgeClassNames.archived;
  }

  if (link.topicArchivedAt || link.educationOrganizationIsActive === false || !link.isActive) {
    return adminBadgeClassNames.warning;
  }

  return adminBadgeClassNames.success;
};

export const getPublicTemplateBadgeLabel = (link: PublicLinkListItem) =>
  `Шаблон: ${getPublicTemplateLabel(link.publicTemplate)}`;

export const getEntryProfileModeBadgeLabel = (link: PublicLinkListItem) =>
  `Анкета: ${getEntryProfileModeLabel(link.entryProfileMode)}`;

export const getLinkVersionLabel = (link: PublicLinkListItem) => `Тест v${link.topicVersionNumber}`;

/** Номер опубликованной версии теста, если ссылка ведёт на более старую; иначе `null`. */
export const getNewerPublishedVersionNumber = (link: PublicLinkListItem) =>
  link.activePublishedVersionId !== null &&
  link.activePublishedVersionId !== link.publishedVersionId
    ? link.activePublishedVersionNumber
    : null;

export const formatPublicLinkCreatedAt = (value: string) => formatDateTime(value);

export const getLinkRowClassName = (link: PublicLinkListItem) => {
  if (link.archivedAt) {
    return adminClassNames.publicLinks.rowArchived;
  }

  if (link.topicArchivedAt || link.educationOrganizationIsActive === false || !link.isActive) {
    return adminClassNames.publicLinks.rowInactive;
  }

  return adminClassNames.publicLinks.rowActive;
};

export const getEmptyStateText = (publicLinksTab: string, searchValue: string) => {
  if (searchValue.trim()) {
    return 'По вашему запросу ничего не найдено.';
  }

  if (publicLinksTab === 'active') {
    return 'Публичные ссылки еще не созданы.';
  }

  return 'Архив пуст. Здесь появятся архивные ссылки.';
};

export const buildLinkSearchText = (link: PublicLinkListItem) => {
  return [
    link.shortCode,
    link.title,
    link.educationOrganizationName ?? '',
    getLinkStateLabel(link),
    getLinkVersionLabel(link),
    getPublicTemplateBadgeLabel(link),
    getEntryProfileModeBadgeLabel(link),
  ]
    .join(' ')
    .toLowerCase();
};
