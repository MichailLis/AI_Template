import { Copy } from 'lucide-react';
import { useRef } from 'react';
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
  // Email нужен и после закрытия, когда credentials уже null; запоминается при открытии окна.
  const emailRef = useRef<string | null>(null);

  /**
   * Окно открывается из формы создания или из подтверждения сброса, и к закрытию обоих уже нет —
   * фокус падал на body. Возвращаем его на «…» этого пользователя, а если строки на странице нет
   * (другая страница списка или фильтр) — на «Добавить пользователя».
   */
  const handleCloseAutoFocus = (event: Event) => {
    const email = emailRef.current;
    const target =
      (email
        ? document.querySelector<HTMLElement>(
            `[aria-label="${CSS.escape(`Действия для ${email}`)}"]`,
          )
        : null) ??
      [...document.querySelectorAll<HTMLElement>('button')].find(
        (button) => button.textContent?.trim() === 'Добавить пользователя',
      );
    if (target) {
      event.preventDefault();
      target.focus();
    }
  };

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
      <DialogContent
        className={`sm:max-w-md ${adminClassNames.dialog.content}`}
        onOpenAutoFocus={() => {
          emailRef.current = credentials?.email ?? null;
        }}
        onCloseAutoFocus={handleCloseAutoFocus}
      >
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
