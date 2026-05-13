import { FileText, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { ConfirmActionDialog } from '@/shared/ui/confirm-action-dialog';

import type { AnalysisPromptListResponseDtoPromptsItem } from '@/shared/api/model';

interface PromptLibraryCardProps {
  prompts: AnalysisPromptListResponseDtoPromptsItem[];
  selectedPromptId: number | null;
  isLoading: boolean;
  isDeleting: boolean;
  onCreateNewPrompt: () => void;
  onSelectPrompt: (promptId: number) => void;
  onDeletePrompt: (promptId: number) => void;
}

interface PromptLibraryItemProps {
  prompt: AnalysisPromptListResponseDtoPromptsItem;
  isSelected: boolean;
  isDeleting: boolean;
  onSelectPrompt: (promptId: number) => void;
  onDeletePrompt: (promptId: number) => void;
}

const formatPromptDate = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

function PromptLibraryItem({
  prompt,
  isSelected,
  isDeleting,
  onSelectPrompt,
  onDeletePrompt,
}: PromptLibraryItemProps) {
  const latestVersion = prompt.versions[0];
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleConfirmDelete = () => {
    onDeletePrompt(prompt.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <div
      className={cn(
        'flex min-w-0 gap-2 rounded-md border p-2',
        isSelected ? 'border-primary bg-primary/5' : adminClassNames.panel.frame,
      )}
    >
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={() => onSelectPrompt(prompt.id)}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className={`truncate text-sm font-medium ${adminClassNames.text.heading}`}>
            {prompt.title}
          </span>
          {latestVersion ? (
            <>
              <Badge variant="outline">v{latestVersion.versionNumber}</Badge>
              <Badge
                variant="outline"
                className={
                  latestVersion.status === 'PUBLISHED'
                    ? adminBadgeClassNames.success
                    : adminBadgeClassNames.warning
                }
              >
                {latestVersion.status}
              </Badge>
            </>
          ) : null}
        </div>

        <div
          className={`mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs ${adminClassNames.text.muted}`}
        >
          {latestVersion ? <span className="min-w-0 truncate">{latestVersion.model}</span> : null}
          <span>Обновлен {formatPromptDate(prompt.updatedAt)}</span>
        </div>
      </button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={isDeleting}
        aria-label={`Удалить промпт ${prompt.title}`}
        className={`shrink-0 ${adminClassNames.iconButton.danger}`}
        onClick={() => setIsDeleteDialogOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <ConfirmActionDialog
        open={isDeleteDialogOpen}
        title="Удалить промпт?"
        description="Промпт будет скрыт из конструктора. Уже созданные результаты анализа и версии останутся в истории."
        confirmLabel="Удалить"
        variant="destructive"
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
}

export function PromptLibraryCard({
  prompts,
  selectedPromptId,
  isLoading,
  isDeleting,
  onCreateNewPrompt,
  onSelectPrompt,
  onDeletePrompt,
}: PromptLibraryCardProps) {
  return (
    <Card className={`min-w-0 ${adminClassNames.panel.card}`}>
      <CardHeader className={adminClassNames.border.bottom}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Сохраненные промпты
            </CardTitle>
            <CardDescription>
              Выберите промпт для редактирования или создайте новый сценарий анализа.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={onCreateNewPrompt}>
            <Plus className="mr-2 h-4 w-4" />
            Новый промпт
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {isLoading ? (
          <div className={`flex items-center gap-2 p-3 text-sm ${adminClassNames.panel.loading}`}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Загружаем промпты...
          </div>
        ) : null}

        {!isLoading && prompts.length === 0 ? (
          <div className={adminClassNames.panel.empty}>Сохраненных промптов пока нет.</div>
        ) : null}

        {!isLoading && prompts.length > 0 ? (
          <div className="grid gap-2 lg:grid-cols-2">
            {prompts.map((prompt) => (
              <PromptLibraryItem
                key={prompt.id}
                prompt={prompt}
                isSelected={prompt.id === selectedPromptId}
                isDeleting={isDeleting}
                onSelectPrompt={onSelectPrompt}
                onDeletePrompt={onDeletePrompt}
              />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
