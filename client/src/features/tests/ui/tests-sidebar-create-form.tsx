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
    <div className="space-y-2">
      <Label htmlFor="new-topic-title">Название теста</Label>
      <Input
        id="new-topic-title"
        value={newTestTitle}
        onChange={(event) => onNewTestTitleChange(event.target.value)}
        placeholder="Профориентация"
      />

      <Label htmlFor="new-topic-slug">Slug (служебный, необязательно)</Label>
      <Input
        id="new-topic-slug"
        value={newTestSlug}
        onChange={(event) => onNewTestSlugChange(event.target.value)}
        placeholder="career-orientation"
      />

      <Label htmlFor="new-topic-description">Описание (необязательно)</Label>
      <Textarea
        id="new-topic-description"
        value={newTestDescription}
        onChange={(event) => onNewTestDescriptionChange(event.target.value)}
        rows={3}
      />

      <Button className="w-full" onClick={onCreateTest} disabled={isCreating}>
        {isCreating ? 'Создание теста...' : 'Создать тест'}
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={onOpenAiGenerator}
        disabled={isCreatingWithAi}
      >
        {isCreatingWithAi ? 'Создание теста...' : 'Создать тест с ИИ'}
      </Button>
    </div>
  );
}
