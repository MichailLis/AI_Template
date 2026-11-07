import { CircleCheck, History, LoaderCircle, TriangleAlert, Undo2 } from 'lucide-react';
import { useState } from 'react';

import { useRestoreBackup, useUndoRestore } from '@/features/manage-backups';
import { formatDateTime } from '@/shared/lib/date-format';
import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import { ConfirmActionDialog } from '@/shared/ui/confirm-action-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import { RESTORE_CONFIRMATION } from '../lib/admin-settings-backups';

import type { BackupItem } from '../lib/admin-settings-backups';
import type { RestoreOperationStatus } from '../model/use-restore-operation';
import type { FormEvent } from 'react';

/** Ход и итог последнего восстановления и возможность вернуть базу, которая была до него. */
export function RestoreStatusPanel({ status }: { status: RestoreOperationStatus | undefined }) {
  const [isUndoOpen, setIsUndoOpen] = useState(false);
  const { undoRestore, isUndoing } = useUndoRestore({ onUndone: () => setIsUndoOpen(false) });
  const operation = status?.operation;
  const previousDatabase = status?.previousDatabase;

  return (
    <>
      {operation?.status === 'RUNNING' ? (
        <div className={`flex items-start gap-2 ${adminClassNames.panel.infoInline}`}>
          <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin" />
          <span>
            {operation.kind === 'UNDO' ? 'Возвращаем прежнюю базу' : 'Идет восстановление'}:{' '}
            {operation.step}. Сайт временно недоступен; после окончания все войдут заново.
          </span>
        </div>
      ) : null}

      {operation?.status === 'FAILED' ? (
        <div className={`flex items-start gap-2 ${adminClassNames.panel.dangerInline}`}>
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            {operation.kind === 'UNDO' ? 'Не удалось вернуть базу' : 'Восстановление не выполнено'}:{' '}
            {operation.errorMessage}. Рабочая база не изменилась.
          </span>
        </div>
      ) : null}

      {operation?.status === 'SUCCEEDED' && operation.finishedAt ? (
        <div className={`flex items-start gap-2 ${adminClassNames.panel.infoInline}`}>
          <CircleCheck className="mt-0.5 size-4 shrink-0" />
          <span>
            {operation.kind === 'UNDO'
              ? `Прежняя база возвращена ${formatDateTime(operation.finishedAt)}.`
              : `База восстановлена из ${operation.fileName ?? 'копии'} ${formatDateTime(operation.finishedAt)}.`}
          </span>
        </div>
      ) : null}

      {previousDatabase && operation?.status !== 'RUNNING' ? (
        <div
          className={`flex flex-wrap items-center justify-between gap-3 ${adminClassNames.panel.warningInline}`}
        >
          <span className="flex items-start gap-2">
            <History className="mt-0.5 size-4 shrink-0" />
            Восстановление от {formatDateTime(previousDatabase.restoredAt)} можно отменить: прежняя
            база сохранена.
          </span>
          <Button type="button" size="sm" variant="outline" onClick={() => setIsUndoOpen(true)}>
            <Undo2 />
            Отменить восстановление
          </Button>
        </div>
      ) : null}

      <ConfirmActionDialog
        open={isUndoOpen}
        title="Отменить восстановление?"
        description="Вернется база, которая была до восстановления. Все изменения, сделанные после восстановления, пропадут. Сайт будет недоступен около минуты, после этого все войдут заново."
        confirmLabel="Вернуть прежнюю базу"
        variant="destructive"
        isConfirming={isUndoing}
        onConfirm={undoRestore}
        onClose={() => setIsUndoOpen(false)}
      />
    </>
  );
}

interface RestoreBackupDialogProps {
  backup: BackupItem | null;
  onClose: () => void;
}

/** Подтверждение вводом слова: восстановление заменяет все данные, кнопки «Да» для этого мало. */
export function RestoreBackupDialog({ backup, onClose }: RestoreBackupDialogProps) {
  const [confirmation, setConfirmation] = useState('');
  const { restoreBackup, isRestoring } = useRestoreBackup({
    onStarted: () => {
      setConfirmation('');
      onClose();
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (backup && confirmation === RESTORE_CONFIRMATION && !isRestoring) {
      restoreBackup(backup.id, confirmation);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmation('');
      onClose();
    }
  };

  return (
    <Dialog open={backup !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="admin-surface max-w-md border-admin-border">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Восстановить базу из копии?</DialogTitle>
            <DialogDescription>
              Все текущие данные заменятся данными из {backup?.fileName}. Перед этим будет сохранена
              копия текущей базы, а саму базу можно будет вернуть кнопкой «Отменить восстановление».
              Сайт будет недоступен около минуты, после этого все пользователи, включая вас, войдут
              заново.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="backup-restore-confirmation">
              Для подтверждения введите {RESTORE_CONFIRMATION}
            </Label>
            <Input
              id="backup-restore-confirmation"
              autoComplete="off"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Отмена
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={confirmation !== RESTORE_CONFIRMATION || isRestoring}
            >
              {isRestoring ? 'Запускаем...' : 'Восстановить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
