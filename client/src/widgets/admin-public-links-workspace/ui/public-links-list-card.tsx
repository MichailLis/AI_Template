import { Archive, MoreHorizontal, Power, PowerOff, RefreshCcw, RotateCcw } from 'lucide-react';
import { useMemo } from 'react';

import { cn } from '@/shared/lib/utils';
import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminStateBlock } from '@/shared/ui/admin-state-block';
import { Button } from '@/shared/ui/button';
import { CardContent } from '@/shared/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

import { PublicLinkQuickActions } from './public-link-quick-actions';

import type { PublicLinksTab } from './admin-public-links-workspace.helpers';

interface PublicLinkListItem {
  id: number;
  shortCode: string;
  title: string;
  educationOrganizationName: string | null;
  archivedAt: string | null;
  isActive: boolean;
}

interface PublicLinksListCardProps {
  publicLinksTab: PublicLinksTab;
  visiblePublicLinks: PublicLinkListItem[];
  publicLinksLoading: boolean;
  publicLinksError: boolean;
  searchValue: string;
  onRetryPublicLinks: () => void;
  onCopyShortLink: (shortCode: string) => Promise<void>;
  onOpenShortLink: (shortCode: string) => void;
  onOpenQr: (shortCode: string) => void;
  onTogglePublicLink: (linkId: number, nextActive: boolean) => void;
  onRegenerateShortCode: (linkId: number) => void;
  onArchivePublicLink: (linkId: number) => void;
  onRestorePublicLink: (linkId: number) => void;
  isUpdatingPublicLink: boolean;
  isRegeneratingShortCode: boolean;
  isArchivingPublicLink: boolean;
  isRestoringPublicLink: boolean;
}

type PublicLinkActionHandlers = Pick<
  PublicLinksListCardProps,
  | 'onCopyShortLink'
  | 'onOpenShortLink'
  | 'onOpenQr'
  | 'onTogglePublicLink'
  | 'onRegenerateShortCode'
  | 'onArchivePublicLink'
  | 'onRestorePublicLink'
  | 'isUpdatingPublicLink'
  | 'isRegeneratingShortCode'
  | 'isArchivingPublicLink'
  | 'isRestoringPublicLink'
>;

interface PublicLinkRowProps extends PublicLinkActionHandlers {
  link: PublicLinkListItem;
  publicLinksTab: PublicLinksTab;
}

interface PublicLinkActionMenuProps extends PublicLinkActionHandlers {
  link: PublicLinkListItem;
  publicLinksTab: PublicLinksTab;
}

interface ActivePublicLinkActionsProps extends PublicLinkActionHandlers {
  link: PublicLinkListItem;
}

interface ArchivedPublicLinkActionsProps {
  link: PublicLinkListItem;
  onRestorePublicLink: (linkId: number) => void;
  isRestoringPublicLink: boolean;
}

const getLinkStateLabel = (link: PublicLinkListItem) => {
  if (link.archivedAt) {
    return 'В архиве';
  }

  return link.isActive ? 'Активна' : 'Отключена';
};

const getLinkStateClassName = (link: PublicLinkListItem) => {
  if (link.archivedAt) {
    return adminBadgeClassNames.archived;
  }

  if (link.isActive) {
    return adminBadgeClassNames.success;
  }

  return adminBadgeClassNames.warning;
};

const getLinkRowClassName = (link: PublicLinkListItem) => {
  if (link.archivedAt) {
    return adminClassNames.publicLinks.rowArchived;
  }

  if (!link.isActive) {
    return adminClassNames.publicLinks.rowInactive;
  }

  return adminClassNames.publicLinks.rowActive;
};

const getEmptyStateText = (publicLinksTab: PublicLinksTab, searchValue: string) => {
  if (searchValue.trim()) {
    return 'По вашему запросу ничего не найдено.';
  }

  if (publicLinksTab === 'active') {
    return 'Публичные ссылки еще не созданы.';
  }

  return 'Архив пуст. Здесь появятся архивные ссылки.';
};

const buildLinkSearchText = (link: PublicLinkListItem) => {
  return [link.shortCode, link.title, link.educationOrganizationName ?? '', getLinkStateLabel(link)]
    .join(' ')
    .toLowerCase();
};

function ActivePublicLinkActions({
  link,
  onTogglePublicLink,
  onRegenerateShortCode,
  onArchivePublicLink,
  isUpdatingPublicLink,
  isRegeneratingShortCode,
  isArchivingPublicLink,
}: ActivePublicLinkActionsProps) {
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 justify-start px-2 text-left text-sm"
        onClick={() => onTogglePublicLink(link.id, !link.isActive)}
        disabled={isUpdatingPublicLink}
      >
        {link.isActive ? (
          <PowerOff className="mr-2 h-3.5 w-3.5" />
        ) : (
          <Power className="mr-2 h-3.5 w-3.5" />
        )}
        {link.isActive ? 'Деактивировать' : 'Активировать'}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 justify-start px-2 text-left text-sm"
        onClick={() => onRegenerateShortCode(link.id)}
        disabled={isRegeneratingShortCode}
      >
        <RefreshCcw className="mr-2 h-3.5 w-3.5" />
        Новый код
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={adminClassNames.actionMenu.dangerItem}
        onClick={() => onArchivePublicLink(link.id)}
        disabled={isArchivingPublicLink}
      >
        <Archive className="mr-2 h-3.5 w-3.5" />
        Архивировать
      </Button>
    </>
  );
}

function ArchivedPublicLinkActions({
  link,
  onRestorePublicLink,
  isRestoringPublicLink,
}: ArchivedPublicLinkActionsProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 justify-start px-2 text-left text-sm"
      onClick={() => onRestorePublicLink(link.id)}
      disabled={isRestoringPublicLink}
    >
      <RotateCcw className="mr-2 h-3.5 w-3.5" />
      Восстановить
    </Button>
  );
}

function PublicLinkActionMenu({ link, publicLinksTab, ...handlers }: PublicLinkActionMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={`h-8 w-8 ${adminClassNames.iconButton.muted}`}
          aria-label="Действия публичной ссылки"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="end">
        <div className="flex flex-col">
          {publicLinksTab === 'active' ? (
            <ActivePublicLinkActions link={link} {...handlers} />
          ) : (
            <ArchivedPublicLinkActions
              link={link}
              onRestorePublicLink={handlers.onRestorePublicLink}
              isRestoringPublicLink={handlers.isRestoringPublicLink}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PublicLinkRow({ link, publicLinksTab, onOpenShortLink, ...handlers }: PublicLinkRowProps) {
  return (
    <div className={cn(adminClassNames.publicLinks.rowBase, getLinkRowClassName(link))}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={cn(
              'text-left text-sm font-semibold underline-offset-2 hover:underline',
              link.archivedAt || !link.isActive
                ? adminClassNames.text.muted
                : adminClassNames.text.heading,
            )}
            onClick={() => onOpenShortLink(link.shortCode)}
          >
            {link.shortCode}
          </button>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getLinkStateClassName(
              link,
            )}`}
          >
            {getLinkStateLabel(link)}
          </span>
        </div>
        <div
          className={`mt-1 flex min-w-0 flex-wrap items-center gap-2 text-sm ${adminClassNames.text.body}`}
        >
          <span className="min-w-0 truncate">{link.title}</span>
          {link.educationOrganizationName ? (
            <>
              <span className={adminClassNames.publicLinks.divider}>/</span>
              <span className={`min-w-0 truncate ${adminClassNames.text.muted}`}>
                {link.educationOrganizationName}
              </span>
            </>
          ) : null}
        </div>
        {!link.archivedAt && !link.isActive ? (
          <p className={`mt-1 text-xs font-medium ${adminClassNames.publicLinks.inactiveNotice}`}>
            Доступ закрыт для участников
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1 self-start sm:self-center">
        {publicLinksTab === 'active' ? (
          <PublicLinkQuickActions
            shortCode={link.shortCode}
            onOpenShortLink={onOpenShortLink}
            onCopyShortLink={handlers.onCopyShortLink}
            onOpenQr={handlers.onOpenQr}
          />
        ) : null}
        <PublicLinkActionMenu
          link={link}
          publicLinksTab={publicLinksTab}
          onOpenShortLink={onOpenShortLink}
          {...handlers}
        />
      </div>
    </div>
  );
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
