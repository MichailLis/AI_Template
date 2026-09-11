import { Copy } from 'lucide-react';
import { toast } from 'sonner';

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

import type { IssuedCredentials } from './admin-users-workspace.types';

interface AdminUserCredentialsDialogProps {
  credentials: IssuedCredentials | null;
  onClose: () => void;
}

/**
 * Сервер хранит только хэш пароля, поэтому это единственный момент, когда пароль можно увидеть.
 * Если пользователь его забудет, пароль сбрасывают ещё раз, и окно покажет новый.
 */
export function AdminUserCredentialsDialog({
  credentials,
  onClose,
}: AdminUserCredentialsDialogProps) {
  const handleCopy = async () => {
    if (!credentials) {
      return;
    }

    try {
      await navigator.clipboard.writeText(credentials.password);
      toast.success('Пароль скопирован');
    } catch {
      toast.error('Не удалось скопировать пароль');
    }
  };

  return (
    <Dialog open={credentials !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`sm:max-w-md ${adminClassNames.dialog.content}`}>
        <DialogHeader>
          <DialogTitle>
            {credentials?.reason === 'reset' ? 'Новый пароль' : 'Пользователь создан'}
          </DialogTitle>
          <DialogDescription>
            Передайте пароль пользователю сейчас: после закрытия окна посмотреть его снова нельзя.
            Если пароль забудут, сбросьте его ещё раз.
          </DialogDescription>
        </DialogHeader>

        {credentials ? (
          <div className="flex flex-col gap-1">
            <p className={`text-xs ${adminClassNames.text.muted}`}>
              Пароль для {credentials.email}
            </p>
            <code
              aria-label="Пароль"
              className="break-all rounded-md border border-admin-border bg-admin-panel-muted px-3 py-2 font-mono text-base tracking-wide text-foreground"
            >
              {credentials.password}
            </code>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:space-x-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Готово
          </Button>
          <Button type="button" onClick={() => void handleCopy()}>
            <Copy aria-hidden="true" className="size-4" />
            Скопировать пароль
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
