import { useMemo } from 'react';

import { AdminStateBlock } from '@/shared/ui/admin-state-block';
import { Button } from '@/shared/ui/button';
import { CardContent } from '@/shared/ui/card';

import { buildLinkSearchText, getEmptyStateText } from './public-links-list-card.helpers';
import { PublicLinkRow } from './public-links-list-card.row';

import type { PublicLinksTab } from './admin-public-links-workspace.helpers';
import type { PublicLinkListItem } from './public-links-list-card.helpers';
import type { PublicLinkActionHandlers } from './public-links-list-card.row';

interface PublicLinksListCardProps extends PublicLinkActionHandlers {
  publicLinksTab: PublicLinksTab;
  visiblePublicLinks: PublicLinkListItem[];
  publicLinksLoading: boolean;
  publicLinksError: boolean;
  searchValue: string;
  onRetryPublicLinks: () => void;
}

export function PublicLinksListCard({
  publicLinksTab,
  visiblePublicLinks,
  publicLinksLoading,
  publicLinksError,
  searchValue,
  onRetryPublicLinks,
  ...handlers
}: PublicLinksListCardProps) {
  const filteredPublicLinks = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return visiblePublicLinks;
    }

    return visiblePublicLinks.filter((link) => buildLinkSearchText(link).includes(query));
  }, [searchValue, visiblePublicLinks]);

  if (publicLinksLoading) {
    return (
      <CardContent className="p-0">
        <AdminStateBlock>Загрузка публичных ссылок... Пожалуйста, подождите.</AdminStateBlock>
      </CardContent>
    );
  }

  if (publicLinksError) {
    return (
      <CardContent className="p-0">
        <AdminStateBlock
          tone="danger"
          action={
            <Button type="button" size="sm" variant="outline" onClick={onRetryPublicLinks}>
              Повторить
            </Button>
          }
        >
          Не удалось загрузить публичные ссылки. Проверьте подключение и повторите попытку.
        </AdminStateBlock>
      </CardContent>
    );
  }

  if (filteredPublicLinks.length === 0) {
    return (
      <CardContent className="p-0">
        <AdminStateBlock>{getEmptyStateText(publicLinksTab, searchValue)}</AdminStateBlock>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-0">
      {filteredPublicLinks.map((link) => (
        <PublicLinkRow key={link.id} link={link} publicLinksTab={publicLinksTab} {...handlers} />
      ))}
    </CardContent>
  );
}
