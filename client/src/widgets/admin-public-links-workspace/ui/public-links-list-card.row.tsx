import {
  Archive,
  ArrowUpRight,
  MoreHorizontal,
  Palette,
  Power,
  PowerOff,
  RefreshCcw,
  RotateCcw,
} from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

import { PublicLinkQuickActions } from './public-link-quick-actions';
import {
  formatPublicLinkCreatedAt,
  getEntryProfileModeBadgeLabel,
  getLinkRowClassName,
  getLinkStateClassName,
  getLinkStateLabel,
  getLinkVersionLabel,
  getNewerPublishedVersionNumber,
  getPublicTemplateBadgeLabel,
  isPublicLinkClosedForStudents,
} from './public-links-list-card.helpers';

import type { PublicLinksTab } from './admin-public-links-workspace.helpers';
import type { PublicLinkListItem } from './public-links-list-card.helpers';

export interface PublicLinkActionHandlers {
  onCopyShortLink: (shortCode: string) => Promise<void>;
  onOpenShortLink: (shortCode: string) => void;
  onOpenQr: (shortCode: string) => void;
  onOpenBrandingBuilder: (link: PublicLinkListItem) => void;
  onTogglePublicLink: (linkId: number, nextActive: boolean) => void;
  onRegenerateShortCode: (linkId: number) => void;
  onArchivePublicLink: (linkId: number) => void;
  onRestorePublicLink: (linkId: number) => void;
  onMoveToActiveVersion: (link: PublicLinkListItem) => void;
  isUpdatingPublicLink: boolean;
  isRegeneratingShortCode: boolean;
  isArchivingPublicLink: boolean;
  isRestoringPublicLink: boolean;
}

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

function ActivePublicLinkActions({
  link,
  onTogglePublicLink,
  onOpenBrandingBuilder,
  onRegenerateShortCode,
  onArchivePublicLink,
  onMoveToActiveVersion,
  isUpdatingPublicLink,
  isRegeneratingShortCode,
  isArchivingPublicLink,
}: ActivePublicLinkActionsProps) {
  const newerVersionNumber = getNewerPublishedVersionNumber(link);

  return (
    <>
      {newerVersionNumber !== null ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 justify-start px-2 text-left text-sm"
          onClick={() => onMoveToActiveVersion(link)}
        >
          <ArrowUpRight className="mr-2 h-3.5 w-3.5" />
          {`Перевести на v${newerVersionNumber}`}
        </Button>
      ) : null}
      {link.publicTemplate === 'STANDARD' ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 justify-start px-2 text-left text-sm"
          onClick={() => onOpenBrandingBuilder(link)}
        >
          <Palette className="mr-2 h-3.5 w-3.5" />
          Оформление страницы
        </Button>
      ) : null}
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
        Перевыпустить код
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
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Меню закрывается вместе с запуском действия: команды открывают диалог поверх списка, и
   * оставшийся открытым поповер висел под ним чужим слоем.
   */
  const closeAfter =
    <TArgs extends unknown[]>(action: (...args: TArgs) => void) =>
    (...args: TArgs) => {
      setIsOpen(false);
      action(...args);
    };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
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
            <ActivePublicLinkActions
              link={link}
              {...handlers}
              onOpenBrandingBuilder={closeAfter(handlers.onOpenBrandingBuilder)}
              onTogglePublicLink={closeAfter(handlers.onTogglePublicLink)}
              onRegenerateShortCode={closeAfter(handlers.onRegenerateShortCode)}
              onArchivePublicLink={closeAfter(handlers.onArchivePublicLink)}
              onMoveToActiveVersion={closeAfter(handlers.onMoveToActiveVersion)}
            />
          ) : (
            <ArchivedPublicLinkActions
              link={link}
              onRestorePublicLink={closeAfter(handlers.onRestorePublicLink)}
              isRestoringPublicLink={handlers.isRestoringPublicLink}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function PublicLinkRow({
  link,
  publicLinksTab,
  onOpenShortLink,
  ...handlers
}: PublicLinkRowProps) {
  const newerVersionNumber = getNewerPublishedVersionNumber(link);

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
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${adminBadgeClassNames.neutral}`}
          >
            {getPublicTemplateBadgeLabel(link)}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${adminBadgeClassNames.neutral}`}
          >
            {getEntryProfileModeBadgeLabel(link)}
          </span>
        </div>
        <div
          className={`mt-1 flex min-w-0 flex-wrap items-center gap-2 text-sm ${adminClassNames.text.body}`}
        >
          <span className="min-w-0 truncate">{link.title}</span>
          <span className={`shrink-0 text-xs font-medium ${adminClassNames.text.muted}`}>
            {getLinkVersionLabel(link)}
          </span>
          {newerVersionNumber !== null ? (
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${adminBadgeClassNames.warning}`}
            >
              {`есть v${newerVersionNumber}`}
            </span>
          ) : null}
          <span className={`shrink-0 text-xs ${adminClassNames.text.muted}`}>
            Создана: {formatPublicLinkCreatedAt(link.createdAt)}
          </span>
          {link.educationOrganizationName ? (
            <>
              <span className={adminClassNames.publicLinks.divider}>/</span>
              <span className={`min-w-0 truncate ${adminClassNames.text.muted}`}>
                {link.educationOrganizationName}
              </span>
            </>
          ) : null}
        </div>
        {!link.archivedAt && isPublicLinkClosedForStudents(link) ? (
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
