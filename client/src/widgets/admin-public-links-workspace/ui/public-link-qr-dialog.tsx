import { Copy, ExternalLink } from 'lucide-react';

import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

interface PublicLinkQrDialogProps {
  shortCode: string | null;
  linkUrl: string;
  qrUrl: string;
  onClose: () => void;
  onCopyShortLink: (shortCode: string) => Promise<void>;
}

/**
 * Раньше кнопка «QR-код» открывала картинку в новой вкладке, и админ уходил из списка ради одного
 * изображения. Диалог показывает код рядом с самой ссылкой: код можно показать студентам с экрана,
 * ссылку — скопировать, а изображение при необходимости открыть отдельно и сохранить.
 */
export function PublicLinkQrDialog({
  shortCode,
  linkUrl,
  qrUrl,
  onClose,
  onCopyShortLink,
}: PublicLinkQrDialogProps) {
  return (
    <Dialog open={shortCode !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`sm:max-w-md ${adminClassNames.dialog.content}`}>
        <DialogHeader>
          <DialogTitle>QR-код ссылки {shortCode}</DialogTitle>
          <DialogDescription>
            Покажите код студентам или откройте изображение, чтобы сохранить его.
          </DialogDescription>
        </DialogHeader>

        {shortCode ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={qrUrl}
              alt={`QR-код публичной ссылки ${shortCode}`}
              className="size-56 rounded-md border border-admin-border bg-white p-2"
            />
            <p className={`break-all text-center text-sm ${adminClassNames.text.muted}`}>
              {linkUrl}
            </p>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:space-x-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Закрыть
          </Button>
          <Button asChild type="button" variant="outline">
            <a href={qrUrl} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden="true" className="size-4" />
              Открыть изображение
            </a>
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (shortCode) {
                void onCopyShortLink(shortCode);
              }
            }}
          >
            <Copy aria-hidden="true" className="size-4" />
            Скопировать ссылку
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
