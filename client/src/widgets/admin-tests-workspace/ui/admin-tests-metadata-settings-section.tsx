import { adminClassNames, adminToneClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
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
  onSaveDraft: () => void;
}

function getDraftStatusText(isSelectedTopicArchived: boolean, isDraftDirty: boolean) {
  if (isSelectedTopicArchived) {
    return 'Редактирование отключено: тест в архиве';
  }
  if (isDraftDirty) {
    return 'Есть несохраненные изменения';
  }
  return 'Изменения сохранены';
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
  onSaveDraft,
}: AdminTestsMetadataSettingsSectionProps) {
  const draftStatusText = getDraftStatusText(isSelectedTopicArchived, isDraftDirty);

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
        <div
          className={`flex flex-wrap items-center justify-between gap-2 ${adminClassNames.panel.mutedSection}`}
        >
          <Button
            type="button"
            onClick={onSaveDraft}
            disabled={isSelectedTopicArchived || !isDraftDirty || isSavingDraft}
          >
            {isSavingDraft ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
          <p className={adminClassNames.form.fieldHint}>{draftStatusText}</p>
        </div>
        {autosaveHint ? <p className={adminClassNames.form.fieldHint}>{autosaveHint}</p> : null}
        {autoSaveError ? (
          <p className={`text-xs ${adminToneClassNames.danger.text}`}>
            Автосохранение не удалось: {autoSaveError}
          </p>
        ) : null}
      </div>
    </AdminTestsSettingsPanel>
  );
}
