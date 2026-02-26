import { Button } from '@/shared/ui/button';
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
import { Textarea } from '@/shared/ui/textarea';

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
      <DialogContent className="border-slate-200">
        <DialogHeader>
          <DialogTitle>Создать тест</DialogTitle>
          <DialogDescription>
            Заполните базовую информацию для нового теста. Редактировать можно будет позже.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-topic-title">Название теста *</Label>
            <Input
              id="new-topic-title"
              value={newTestTitle}
              onChange={(event) => onNewTestTitleChange(event.target.value)}
              placeholder="Карьерная ориентация"
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-topic-slug">Slug (служебный, необязательно)</Label>
            <Input
              id="new-topic-slug"
              value={newTestSlug}
              onChange={(event) => onNewTestSlugChange(event.target.value)}
              placeholder="career-orientation"
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-topic-description">Описание (необязательно)</Label>
            <Textarea
              id="new-topic-description"
              value={newTestDescription}
              onChange={(event) => onNewTestDescriptionChange(event.target.value)}
              rows={3}
              placeholder="Краткое описание для студентов..."
              disabled={isCreating}
            />
          </div>
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
