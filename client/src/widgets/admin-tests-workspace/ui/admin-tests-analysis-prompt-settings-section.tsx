import { useMemo } from 'react';

import { useAnalysisPromptsControllerListPrompts } from '@/shared/api/generated/admin/admin';
import { adminClassNames, adminToneClassNames } from '@/shared/ui/admin-design-tokens';
import { Label } from '@/shared/ui/label';

import { AdminTestsSettingsPanel } from './admin-tests-settings-panel';

export interface AnalysisPromptVersionSummary {
  id: number;
  promptId: number;
  promptTitle: string;
  versionNumber: number;
  model: string;
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
      <div className="mt-3 space-y-2">
        <Label htmlFor="settings-analysis-prompt">Активный промпт</Label>
        <select
          id="settings-analysis-prompt"
          value={selectedAnalysisPromptVersionId ?? ''}
          disabled={isSelectedTopicArchived || promptsQuery.isLoading}
          onChange={(event) =>
            onDraftAnalysisPromptVersionChange(
              event.target.value ? Number(event.target.value) : null,
            )
          }
          className={adminClassNames.form.select}
        >
          <option value="">Не подключать анализ</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label} · {option.model}
            </option>
          ))}
        </select>
        {promptsQuery.isError ? (
          <p className={`text-xs ${adminToneClassNames.danger.text}`}>
            Не удалось загрузить промпты анализа.
          </p>
        ) : null}
      </div>
    </AdminTestsSettingsPanel>
  );
}
