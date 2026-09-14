import { FileText, History, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { formatDateTime } from '@/shared/lib/date-format';
import { getVersionStatusLabel } from '@/shared/lib/report-value-labels';
import { pluralizeRu } from '@/shared/lib/ru-plural';
import { cn } from '@/shared/lib/utils';
import {
  adminBadgeClassNames,
  adminClassNames,
  adminToneClassNames,
} from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { ConfirmActionDialog } from '@/shared/ui/confirm-action-dialog';

import { getPromptUsageSummary } from './admin-prompts-workspace.helpers';
import { PromptHistoryDialog } from './prompt-history-dialog';

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

const formatPromptDate = (value: string) => formatDateTime(value);

type PromptActiveTest = AnalysisPromptListResponseDtoPromptsItem['activeTests'][number];

const formatTestList = (tests: PromptActiveTest[]) =>
  tests.map((test) => `«${test.title}» (${test.slug})`).join(', ');

/**
 * Фоновый анализ берет промпт из версии теста и на архив промпта не смотрит. Поэтому промпт, на
 * котором работают опубликованные тесты, удалить нельзя, а про черновики нужно предупредить.
 */
const getDeleteDialogCopy = (prompt: AnalysisPromptListResponseDtoPromptsItem) => {
  const publishedTests = prompt.activeTests.filter((test) => test.onPublishedVersion);
  const draftTests = prompt.activeTests.filter((test) => !test.onPublishedVersion);

  if (publishedTests.length > 0) {
    return {
      isBlocked: true,
      title: 'Промпт нельзя удалить',
      description: `Промпт анализирует прохождения опубликованных тестов: ${formatTestList(publishedTests)}. Подключите к ним другой промпт и опубликуйте новые версии, затем удалите этот.`,
    };
  }

  if (draftTests.length > 0) {
    return {
      isBlocked: false,
      title: 'Удалить промпт?',
      description: `Промпт подключен к черновикам: ${formatTestList(draftTests)}. Перед публикацией подключите к ним другой промпт: после удаления этот нельзя будет выбрать заново.`,
    };
  }

  return {
    isBlocked: false,
    title: 'Удалить промпт?',
    description:
      'Промпт будет скрыт из конструктора. Уже созданные результаты анализа и версии останутся в истории.',
  };
};

/** Кнопки истории и удаления промпта со своими диалогами. */
function PromptItemActions({
  prompt,
  isDeleting,
  onDeletePrompt,
}: Pick<PromptLibraryItemProps, 'prompt' | 'isDeleting' | 'onDeletePrompt'>) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const deleteDialog = getDeleteDialogCopy(prompt);

  const handleConfirmDelete = () => {
    onDeletePrompt(prompt.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-label={`История промпта ${prompt.title}`}
        className={`shrink-0 ${adminClassNames.iconButton.muted}`}
        onClick={() => setIsHistoryOpen(true)}
      >
        <History className="h-4 w-4" />
      </Button>

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

      <PromptHistoryDialog
        prompt={isHistoryOpen ? prompt : null}
        onClose={() => setIsHistoryOpen(false)}
      />

      <ConfirmActionDialog
        open={isDeleteDialogOpen}
        title={deleteDialog.title}
        description={deleteDialog.description}
        confirmLabel="Удалить"
        cancelLabel={deleteDialog.isBlocked ? 'Закрыть' : undefined}
        hideConfirm={deleteDialog.isBlocked}
        variant="destructive"
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </>
  );
}

function PromptLibraryItem({
  prompt,
  isSelected,
  isDeleting,
  onSelectPrompt,
  onDeletePrompt,
}: PromptLibraryItemProps) {
  const latestVersion = prompt.versions[0];
  const usage = getPromptUsageSummary(prompt);
  const usageText =
    usage.publishedVersionNumber === null
      ? 'Не опубликован, тесты его не используют'
      : `Действует v${usage.publishedVersionNumber}, используется в ${usage.testsOnPublishedVersion} ${pluralizeRu(
          usage.testsOnPublishedVersion,
          ['тесте', 'тестах', 'тестах'],
        )}`;
  const outdatedUsageText = `${usage.testsOnOutdatedVersions} ${pluralizeRu(
    usage.testsOnOutdatedVersions,
    ['тест', 'теста', 'тестов'],
  )} ${pluralizeRu(usage.testsOnOutdatedVersions, ['остался', 'остались', 'остались'])} на прежних версиях промпта`;
  return (
    <div
      className={cn(
        'flex min-w-0 gap-2 p-2',
        adminClassNames.panel.selectableItem,
        isSelected ? adminClassNames.panel.selectedItem : null,
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
                {getVersionStatusLabel(latestVersion.status)}
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

        <p className={`mt-1 text-xs ${adminClassNames.text.muted}`}>{usageText}</p>
        {usage.testsOnOutdatedVersions > 0 ? (
          <p className={`mt-1 text-xs font-medium ${adminToneClassNames.warning.text}`}>
            {outdatedUsageText}
          </p>
        ) : null}
      </button>

      <PromptItemActions prompt={prompt} isDeleting={isDeleting} onDeletePrompt={onDeletePrompt} />
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
