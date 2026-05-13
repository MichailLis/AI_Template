import { Copy, ExternalLink, QrCode } from 'lucide-react';

import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';

interface PublicLinkQuickActionsProps {
  shortCode: string;
  onCopyShortLink: (shortCode: string) => Promise<void>;
  onOpenShortLink: (shortCode: string) => void;
  onOpenQr: (shortCode: string) => void;
}

export function PublicLinkQuickActions({
  shortCode,
  onCopyShortLink,
  onOpenShortLink,
  onOpenQr,
}: PublicLinkQuickActionsProps) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={`h-8 w-8 ${adminClassNames.iconButton.muted}`}
        onClick={() => onOpenShortLink(shortCode)}
        aria-label={`Открыть ссылку ${shortCode}`}
        title="Открыть"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={`h-8 w-8 ${adminClassNames.iconButton.muted}`}
        onClick={() => void onCopyShortLink(shortCode)}
        aria-label={`Копировать ссылку ${shortCode}`}
        title="Копировать"
      >
        <Copy className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={`h-8 w-8 ${adminClassNames.iconButton.muted}`}
        onClick={() => onOpenQr(shortCode)}
        aria-label={`Показать QR-код для ${shortCode}`}
        title="QR-код"
      >
        <QrCode className="h-4 w-4" />
      </Button>
    </div>
  );
}
