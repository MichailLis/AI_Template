import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

type PublicLinksTab = 'active' | 'archived';

interface PublicLinkListItem {
  id: number;
  shortCode: string;
  title: string;
  archivedAt: string | null;
  isActive: boolean;
}

interface PublicLinksListCardProps {
  publicLinksTab: PublicLinksTab;
  onSwitchPublicLinksTab: (tab: PublicLinksTab) => void;
  visiblePublicLinks: PublicLinkListItem[];
  effectivePublicLinkId: number | null;
  onSelectPublicLink: (linkId: number) => void;
  onCopyShortLink: (shortCode: string) => Promise<void>;
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

export function PublicLinksListCard({
  publicLinksTab,
  onSwitchPublicLinksTab,
  visiblePublicLinks,
  effectivePublicLinkId,
  onSelectPublicLink,
  onCopyShortLink,
  onOpenQr,
  onTogglePublicLink,
  onRegenerateShortCode,
  onArchivePublicLink,
  onRestorePublicLink,
  isUpdatingPublicLink,
  isRegeneratingShortCode,
  isArchivingPublicLink,
  isRestoringPublicLink,
}: PublicLinksListCardProps) {
  const getLinkStateLabel = (link: PublicLinkListItem) => {
    if (link.archivedAt) {
      return 'В архиве';
    }

    return link.isActive ? 'Активна' : 'Отключена';
  };

  return (
    <Card className="h-full border-slate-200">
      <CardHeader className="space-y-2">
        <CardTitle className="text-base">Ссылки и архив</CardTitle>
        <CardDescription>Операции со ссылками без перехода между экранами.</CardDescription>
      </CardHeader>
      <CardContent className="flex h-[calc(100%-6.5rem)] flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={publicLinksTab === 'active' ? 'default' : 'outline'}
            onClick={() => onSwitchPublicLinksTab('active')}
          >
            Активные
          </Button>
          <Button
            type="button"
            size="sm"
            variant={publicLinksTab === 'archived' ? 'default' : 'outline'}
            onClick={() => onSwitchPublicLinksTab('archived')}
          >
            Архив
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {visiblePublicLinks.map((link) => (
            <div
              key={link.id}
              className={`rounded-md border p-3 ${
                link.id === effectivePublicLinkId
                  ? 'border-primary bg-slate-50'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="text-left text-sm font-medium text-slate-900 underline-offset-2 hover:underline"
                  onClick={() => onSelectPublicLink(link.id)}
                >
                  {link.shortCode}
                </button>
                <span className="text-xs text-slate-600">{link.title}</span>
                <span className="ml-auto text-xs text-slate-500">{getLinkStateLabel(link)}</span>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {publicLinksTab === 'active' ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void onCopyShortLink(link.shortCode)}
                    >
                      Копировать
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenQr(link.shortCode)}
                    >
                      QR
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onTogglePublicLink(link.id, !link.isActive)}
                      disabled={isUpdatingPublicLink}
                    >
                      {link.isActive ? 'Деактивировать' : 'Активировать'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onRegenerateShortCode(link.id)}
                      disabled={isRegeneratingShortCode}
                    >
                      Новый код
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => onArchivePublicLink(link.id)}
                      disabled={isArchivingPublicLink}
                    >
                      Архивировать
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onRestorePublicLink(link.id)}
                    disabled={isRestoringPublicLink}
                  >
                    Восстановить
                  </Button>
                )}
              </div>
            </div>
          ))}

          {visiblePublicLinks.length === 0 ? (
            <p className="text-sm text-slate-500">
              {publicLinksTab === 'active'
                ? 'Публичные ссылки еще не созданы.'
                : 'Архив пуст. Здесь появятся архивные ссылки.'}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
