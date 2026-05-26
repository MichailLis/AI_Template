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
  isActive: boolean;
}

export const getLinkStateLabel = (link: PublicLinkListItem) => {
  if (link.archivedAt) {
    return 'В архиве';
  }

  return link.isActive ? 'Активна' : 'Отключена';
};

export const getLinkStateClassName = (link: PublicLinkListItem) => {
  if (link.archivedAt) {
    return adminBadgeClassNames.archived;
  }

  if (link.isActive) {
    return adminBadgeClassNames.success;
  }

  return adminBadgeClassNames.warning;
};

export { getEntryProfileModeLabel, getPublicTemplateLabel };

const publicLinkCreatedAtFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatPublicLinkCreatedAt = (value: string) =>
  publicLinkCreatedAtFormatter.format(new Date(value));

export const getLinkRowClassName = (link: PublicLinkListItem) => {
  if (link.archivedAt) {
    return adminClassNames.publicLinks.rowArchived;
  }

  if (!link.isActive) {
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
