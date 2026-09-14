import { pluralizeRu } from '@/shared/lib/ru-plural';
import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

import type { ProfOrientationV3PlusCopy } from './admin-tests-import.helpers';

const getCopyStatus = ({ topic, isArchived }: ProfOrientationV3PlusCopy) => {
  if (isArchived) {
    return { label: 'В архиве', className: adminBadgeClassNames.neutral };
  }

  if (topic.publishedVersionNumber) {
    return {
      label: `Опубликован v${topic.publishedVersionNumber}`,
      className: adminBadgeClassNames.success,
    };
  }

  return { label: 'Только черновик', className: adminBadgeClassNames.warning };
};

const getImportDescription = (copyCount: number) =>
  copyCount === 0
    ? 'Будет создан новый тест из встроенной методики профориентации v3+. Он появится черновиком: вопросы можно поправить до публикации.'
    : `Уже есть ${copyCount} ${pluralizeRu(copyCount, ['копия', 'копии', 'копий'])} этой методики. Откройте нужную или создайте еще одну — она появится отдельным тестом.`;

const getConfirmLabel = (copyCount: number, isImporting: boolean) => {
  if (isImporting) {
    return 'Импортируем...';
  }

  return copyCount > 0 ? 'Создать еще одну' : 'Импортировать';
};

interface AdminTestsImportDialogProps {
  open: boolean;
  copies: ProfOrientationV3PlusCopy[];
  isImporting: boolean;
  onOpenCopy: (topicId: number) => void;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * «Импорт v3+» создает тест, а не открывает методику, поэтому сначала показывает существующие
 * копии: чаще всего нужная уже есть.
 */
export function AdminTestsImportDialog({
  open,
  copies,
  isImporting,
  onOpenCopy,
  onConfirm,
  onClose,
}: AdminTestsImportDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <AlertDialogContent className="admin-surface max-w-lg border-admin-border">
        <AlertDialogHeader>
          <AlertDialogTitle>Импортировать методику v3+?</AlertDialogTitle>
          <AlertDialogDescription>{getImportDescription(copies.length)}</AlertDialogDescription>
        </AlertDialogHeader>

        {copies.length > 0 ? (
          <ul className="max-h-64 divide-y divide-admin-border overflow-y-auto rounded-md border border-admin-border">
            {copies.map((copy) => {
              const status = getCopyStatus(copy);

              return (
                <li key={copy.topic.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium ${adminClassNames.text.heading}`}>
                      {copy.topic.draftTitle}
                    </p>
                    <p className={`truncate font-mono text-xs ${adminClassNames.text.muted}`}>
                      {copy.topic.slug}
                    </p>
                  </div>
                  <Badge variant="outline" className={status.className}>
                    {status.label}
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isImporting}
                    onClick={() => onOpenCopy(copy.topic.id)}
                  >
                    Открыть
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isImporting}>Отмена</AlertDialogCancel>
          <Button type="button" onClick={onConfirm} disabled={isImporting}>
            {getConfirmLabel(copies.length, isImporting)}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
