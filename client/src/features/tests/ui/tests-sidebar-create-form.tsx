import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

interface TestsSidebarCreateFormProps {
  newTestTitle: string;
  newTestSlug: string;
  newTestDescription: string;
  isCreating: boolean;
  isCreatingWithAi: boolean;
  onNewTestTitleChange: (value: string) => void;
  onNewTestSlugChange: (value: string) => void;
  onNewTestDescriptionChange: (value: string) => void;
  onCreateTest: () => void;
  onOpenAiGenerator: () => void;
}

export function TestsSidebarCreateForm({
  newTestTitle,
  newTestSlug,
  newTestDescription,
  isCreating,
  isCreatingWithAi,
  onNewTestTitleChange,
  onNewTestSlugChange,
  onNewTestDescriptionChange,
  onCreateTest,
  onOpenAiGenerator,
}: TestsSidebarCreateFormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="new-topic-title">Название теста</Label>
        <Input
          id="new-topic-title"
          value={newTestTitle}
          onChange={(event) => onNewTestTitleChange(event.target.value)}
          placeholder="Карьерная ориентация"
        />
      </div>

      <div>
        <Label htmlFor="new-topic-slug">Slug (служебный, необязательно)</Label>
        <Input
          id="new-topic-slug"
          value={newTestSlug}
          onChange={(event) => onNewTestSlugChange(event.target.value)}
          placeholder="career-orientation"
        />
      </div>

      <div>
        <Label htmlFor="new-topic-description">Описание (необязательно)</Label>
        <Textarea
          id="new-topic-description"
          value={newTestDescription}
          onChange={(event) => onNewTestDescriptionChange(event.target.value)}
          rows={3}
          placeholder="Краткое описание для студентов..."
        />
      </div>

      <Button className="w-full" onClick={onCreateTest} disabled={isCreating}>
        {isCreating ? 'Создание...' : 'Создать тест'}
      </Button>

      <p className="text-xs text-slate-500 text-center pt-1">или</p>

      <Button
        type="button"
        variant="ghost"
        className="w-full text-sm"
        onClick={onOpenAiGenerator}
        disabled={isCreatingWithAi}
      >
        {isCreatingWithAi ? 'Генерация...' : 'Сгенерировать с ИИ'}
      </Button>
    </div>
  );
}
