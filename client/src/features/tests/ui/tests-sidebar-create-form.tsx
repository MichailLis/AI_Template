import { Button } from '@/shared/ui/button';

import { TestsTopicBaseFields } from './tests-topic-base-fields';

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
      <TestsTopicBaseFields
        title={newTestTitle}
        slug={newTestSlug}
        description={newTestDescription}
        onTitleChange={onNewTestTitleChange}
        onSlugChange={onNewTestSlugChange}
        onDescriptionChange={onNewTestDescriptionChange}
      />

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
