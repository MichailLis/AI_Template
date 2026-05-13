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
          <DialogTitle>Создать тест</DialogTitle>
          <DialogDescription>
            Заполните базовую информацию для нового теста. Редактировать можно будет позже.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
