import { useMemo } from 'react';

import { useAnalysisPromptsControllerListPrompts } from '@/shared/api/generated/admin/admin';
import { adminClassNames, adminToneClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminSelectField } from '@/shared/ui/admin-select-field';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';

import { getNewerAnalysisPromptVersion } from './admin-tests-analysis-prompt.helpers';
import { AdminTestsSettingsPanel } from './admin-tests-settings-panel';

export interface AnalysisPromptVersionSummary {
  id: number;
  promptId: number;
  promptTitle: string;
  versionNumber: number;
  model: string;
  promptArchived: boolean;
}

interface AdminTestsAnalysisPromptSettingsSectionProps {
  selectedAnalysisPromptVersion: AnalysisPromptVersionSummary | null;
  selectedAnalysisPromptVersionId: number | null;
  isSelectedTopicArchived: boolean;
  onDraftAnalysisPromptVersionChange: (value: number | null) => void;
}

export function AdminTestsAnalysisPromptSettingsSection({
  selectedAnalysisPromptVersion,
  selectedAnalysisPromptVersionId,
  isSelectedTopicArchived,
  onDraftAnalysisPromptVersionChange,
}: AdminTestsAnalysisPromptSettingsSectionProps) {
  const promptsQuery = useAnalysisPromptsControllerListPrompts();
  const promptVersionOptions = useMemo(
    () =>
      (promptsQuery.data?.prompts ?? []).flatMap((prompt) =>
        prompt.versions
          .filter((version) => version.status === 'PUBLISHED')
          .map((version) => ({
            id: version.id,
            label: `${prompt.title} · v${version.versionNumber}`,
            model: version.model,
          })),
      ),
    [promptsQuery.data?.prompts],
  );
  const newerPromptVersion = useMemo(
    () =>
      getNewerAnalysisPromptVersion({
        attachedVersion: selectedAnalysisPromptVersion,
        prompts: promptsQuery.data?.prompts ?? [],
      }),
    [promptsQuery.data?.prompts, selectedAnalysisPromptVersion],
  );
  const selectedExists = promptVersionOptions.some(
    (option) => option.id === selectedAnalysisPromptVersionId,
  );
  const options =
    selectedAnalysisPromptVersion && !selectedExists
      ? [
          {
            id: selectedAnalysisPromptVersion.id,
            label: `${selectedAnalysisPromptVersion.promptTitle} · v${selectedAnalysisPromptVersion.versionNumber}`,
            model: selectedAnalysisPromptVersion.model,
          },
          ...promptVersionOptions,
        ]
      : promptVersionOptions;

  return (
    <AdminTestsSettingsPanel
      title="Промпт анализа"
      description="Для версии теста можно подключить одну опубликованную версию промпта."
    >
      <div className="mt-3 flex flex-col gap-2">
        <Label htmlFor="settings-analysis-prompt">Активный промпт</Label>
        <AdminSelectField
          id="settings-analysis-prompt"
          value={selectedAnalysisPromptVersionId ?? ''}
          disabled={isSelectedTopicArchived || promptsQuery.isLoading}
          onChange={(event) =>
            onDraftAnalysisPromptVersionChange(
              event.target.value ? Number(event.target.value) : null,
            )
          }
        >
          <option value="">Не подключать анализ</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label} · {option.model}
            </option>
          ))}
        </AdminSelectField>
        {promptsQuery.isError ? (
          <p className={`text-xs ${adminToneClassNames.danger.text}`}>
            Не удалось загрузить промпты анализа.
          </p>
        ) : null}
        {selectedAnalysisPromptVersion ? (
          <div className={adminClassNames.panel.mutedSection}>
            <p className={`text-xs ${adminClassNames.text.muted}`}>Сейчас подключен</p>
            <p className={`mt-1 text-sm font-medium ${adminClassNames.text.heading}`}>
              {selectedAnalysisPromptVersion.promptTitle} v
              {selectedAnalysisPromptVersion.versionNumber}
            </p>
            <p className={`mt-1 truncate text-xs ${adminClassNames.text.body}`}>
              {selectedAnalysisPromptVersion.model}
            </p>
            {/* Промпт, подключенный только к черновику, можно удалить; сервер такой черновик не
                опубликует, поэтому причину видно заранее, а не только в ошибке публикации. */}
            {selectedAnalysisPromptVersion.promptArchived ? (
              <p className={`mt-2 text-xs font-medium ${adminToneClassNames.danger.text}`}>
                Промпт удален. Подключите другой промпт — иначе тест не опубликовать.
              </p>
            ) : null}
            {newerPromptVersion ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className={`text-xs font-medium ${adminToneClassNames.warning.text}`}>
                  Версия устарела: действует v{newerPromptVersion.versionNumber} (
                  {newerPromptVersion.model}). Пока тест не обновлён, правки промпта до участников
                  не доходят.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={isSelectedTopicArchived}
                  onClick={() => onDraftAnalysisPromptVersionChange(newerPromptVersion.versionId)}
                >
                  Обновить до v{newerPromptVersion.versionNumber}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </AdminTestsSettingsPanel>
  );
}
