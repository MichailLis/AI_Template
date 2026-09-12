import { formatDateTime } from '@/shared/lib/date-format';
import { getEntryProfileModeLabel, getPublicTemplateLabel } from '@/shared/lib/public-test-labels';
import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';

import type { PublicBrandingConfig } from '@/features/tests';

export interface PublicLinkListItem {
  id: number;
  shortCode: string;
  title: string;
  educationOrganizationName: string | null;
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
}

export const isPublicLinkClosedForStudents = (link: PublicLinkListItem) =>
  Boolean(link.archivedAt) || Boolean(link.topicArchivedAt) || !link.isActive;

export const getLinkStateLabel = (link: PublicLinkListItem) => {
  if (link.archivedAt) {
    return 'В архиве';
  }

  if (link.topicArchivedAt) {
    return 'Тест в архиве';
  }

  return link.isActive ? 'Активна' : 'Отключена';
};

export const getLinkStateClassName = (link: PublicLinkListItem) => {
  if (link.archivedAt) {
    return adminBadgeClassNames.archived;
  }

  if (link.topicArchivedAt || !link.isActive) {
    return adminBadgeClassNames.warning;
  }

  return adminBadgeClassNames.success;
};

export { getEntryProfileModeLabel, getPublicTemplateLabel };

export const formatPublicLinkCreatedAt = (value: string) => formatDateTime(value);

export const getLinkRowClassName = (link: PublicLinkListItem) => {
  if (link.archivedAt) {
    return adminClassNames.publicLinks.rowArchived;
  }

  if (link.topicArchivedAt || !link.isActive) {
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
    getPublicTemplateLabel(link.publicTemplate),
    getEntryProfileModeLabel(link.entryProfileMode),
  ]
    .join(' ')
    .toLowerCase();
};
