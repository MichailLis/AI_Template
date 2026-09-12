import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';

interface ConfirmActionDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  variant?: 'default' | 'destructive';
  /** Действие сейчас запрещено: диалог только объясняет причину и не предлагает подтверждение. */
  hideConfirm?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Отмена',
  isConfirming = false,
  variant = 'default',
  hideConfirm = false,
  onConfirm,
  onClose,
}: ConfirmActionDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {/* `admin-surface` — тот же портальный случай, что и у обычных диалогов: без него кнопка
          подтверждения выпадает из админской палитры. */}
      <AlertDialogContent className="admin-surface max-w-md border-admin-border">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>{cancelLabel}</AlertDialogCancel>
          {hideConfirm ? null : (
            <Button type="button" variant={variant} onClick={onConfirm} disabled={isConfirming}>
              {isConfirming ? 'Выполнение...' : confirmLabel}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
