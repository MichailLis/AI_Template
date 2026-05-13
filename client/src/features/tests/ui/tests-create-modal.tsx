import { PlusCircle } from 'lucide-react';

import {
  adminBadgeClassNames,
  adminClassNames,
  adminToneClassNames,
} from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

import { TestsTopicBaseFields } from './tests-topic-base-fields';

interface TestsCreateModalProps {
  open: boolean;
  isCreating: boolean;
  newTestTitle: string;
  newTestSlug: string;
  newTestDescription: string;
  onOpenChange: (nextOpen: boolean) => void;
  onNewTestTitleChange: (value: string) => void;
  onNewTestSlugChange: (value: string) => void;
  onNewTestDescriptionChange: (value: string) => void;
  onCreateTest: () => void;
}

export function TestsCreateModal({
  open,
  isCreating,
  newTestTitle,
  newTestSlug,
  newTestDescription,
  onOpenChange,
  onNewTestTitleChange,
  onNewTestSlugChange,
  onNewTestDescriptionChange,
  onCreateTest,
}: TestsCreateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={adminClassNames.dialog.content}>
        <DialogHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${adminToneClassNames.info.icon}`}
              >
                <PlusCircle className="size-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle>Создать тест</DialogTitle>
                <DialogDescription>
                  Заполните базовую информацию. Редактировать можно будет позже.
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className={adminBadgeClassNames.info}>
              Новый черновик
            </Badge>
          </div>
        </DialogHeader>

        <div className={`my-4 flex flex-col gap-4 ${adminClassNames.panel.compactSection}`}>
          <TestsTopicBaseFields
            title={newTestTitle}
            slug={newTestSlug}
            description={newTestDescription}
            disabled={isCreating}
            titleLabel="Название теста *"
            onTitleChange={onNewTestTitleChange}
            onSlugChange={onNewTestSlugChange}
            onDescriptionChange={onNewTestDescriptionChange}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Отмена
          </Button>
          <Button
            type="button"
            onClick={onCreateTest}
            disabled={isCreating || !newTestTitle.trim()}
          >
            {isCreating ? 'Создание...' : 'Создать тест'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
