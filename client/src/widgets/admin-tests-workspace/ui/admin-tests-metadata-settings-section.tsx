import { adminClassNames, adminToneClassNames } from '@/shared/ui/admin-design-tokens';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import { AdminTestsSettingsPanel } from './admin-tests-settings-panel';

export interface AdminTestsDraftForm {
  title: string;
  description: string;
  analysisPromptVersionId: number | null;
}

interface AdminTestsMetadataSettingsSectionProps {
  draftForm: AdminTestsDraftForm;
  isDraftDirty: boolean;
  isSelectedTopicArchived: boolean;
  isSavingDraft: boolean;
  autoSaveError?: string | null;
  autosaveHint?: string | null;
  onDraftTitleChange: (value: string) => void;
  onDraftDescriptionChange: (value: string) => void;
}

/**
 * У экрана одна модель сохранения: черновик сохраняется сам. Раньше рядом с автосохранением стояла
 * кнопка «Сохранить изменения», и по интерфейсу нельзя было понять, что уже записано, а что нет.
 */
function getDraftStatusText(
  isSelectedTopicArchived: boolean,
  isDraftDirty: boolean,
  isSavingDraft: boolean,
  autosaveHint: string | null | undefined,
) {
  if (isSelectedTopicArchived) {
    return 'Редактирование отключено: тест в архиве';
  }
  if (isSavingDraft) {
    return 'Сохранение...';
  }
  if (isDraftDirty) {
    return 'Изменения сохранятся автоматически';
  }

  return autosaveHint ?? 'Все изменения сохранены';
}

export function AdminTestsMetadataSettingsSection({
  draftForm,
  isDraftDirty,
  isSelectedTopicArchived,
  isSavingDraft,
  autoSaveError,
  autosaveHint,
  onDraftTitleChange,
  onDraftDescriptionChange,
}: AdminTestsMetadataSettingsSectionProps) {
  const draftStatusText = getDraftStatusText(
    isSelectedTopicArchived,
    isDraftDirty,
    isSavingDraft,
    autosaveHint,
  );

  return (
    <AdminTestsSettingsPanel
      title="Метаданные теста"
      description="Редактирование названия и описания версии в работе."
    >
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-draft-title">Название теста</Label>
          <Input
            id="settings-draft-title"
            value={draftForm.title}
            disabled={isSelectedTopicArchived}
            onChange={(event) => onDraftTitleChange(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-draft-description">Описание теста</Label>
          <Textarea
            id="settings-draft-description"
            rows={3}
            value={draftForm.description}
            disabled={isSelectedTopicArchived}
            onChange={(event) => onDraftDescriptionChange(event.target.value)}
          />
        </div>
        <p
          className={`${adminClassNames.form.fieldHint} ${adminClassNames.panel.mutedSection}`}
          aria-live="polite"
        >
          {draftStatusText}
        </p>
        {autoSaveError ? (
          <p className={`text-xs ${adminToneClassNames.danger.text}`}>
            Автосохранение не удалось: {autoSaveError}
          </p>
        ) : null}
      </div>
    </AdminTestsSettingsPanel>
  );
}
