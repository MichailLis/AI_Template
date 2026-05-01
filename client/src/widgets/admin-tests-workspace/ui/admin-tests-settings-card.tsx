import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

interface DraftForm {
  title: string;
  description: string;
}

interface PublishedVersion {
  versionNumber: number;
  title: string;
}

interface AdminTestsSettingsCardProps {
  published: PublishedVersion | null;
  draftForm: DraftForm;
  isDraftDirty: boolean;
  isSelectedTopicArchived: boolean;
  canPublish: boolean;
  isSavingDraft: boolean;
  autoSaveError?: string | null;
  autosaveHint?: string | null;
  isPublishing: boolean;
  isArchivingTopic: boolean;
  isRestoringTopic: boolean;
  onBackToQuestions: () => void;
  onDraftTitleChange: (value: string) => void;
  onDraftDescriptionChange: (value: string) => void;
  onSaveDraft: () => void;
  onRequestPublish: () => void;
  onToggleTopicActive: () => void;
}

interface MetadataSettingsSectionProps {
  draftForm: DraftForm;
  isDraftDirty: boolean;
  isSelectedTopicArchived: boolean;
  isSavingDraft: boolean;
  autoSaveError?: string | null;
  autosaveHint?: string | null;
  onDraftTitleChange: (value: string) => void;
  onDraftDescriptionChange: (value: string) => void;
  onSaveDraft: () => void;
}

interface PublishSectionProps {
  published: PublishedVersion | null;
  isSelectedTopicArchived: boolean;
  canPublish: boolean;
  isPublishing: boolean;
  onRequestPublish: () => void;
}

interface ActivitySwitchSectionProps {
  isSelectedTopicArchived: boolean;
  isArchivingTopic: boolean;
  isRestoringTopic: boolean;
  onToggleTopicActive: () => void;
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

function getPublishButtonLabel(isPublishing: boolean, published: PublishedVersion | null) {
  if (isPublishing) {
    return 'Публикация...';
  }
  if (published) {
    return 'Опубликовать изменения';
  }
  return 'Опубликовать тест';
}

function getPublishHintText(isSelectedTopicArchived: boolean, canPublish: boolean) {
  if (isSelectedTopicArchived) {
    return 'Восстановите тест, чтобы открыть публикацию.';
  }
  if (!canPublish) {
    return 'Для публикации сохраните изменения и добавьте хотя бы один вопрос.';
  }
  return null;
}

function MetadataSettingsSection({
  draftForm,
  isDraftDirty,
  isSelectedTopicArchived,
  isSavingDraft,
  autoSaveError,
  autosaveHint,
  onDraftTitleChange,
  onDraftDescriptionChange,
  onSaveDraft,
}: MetadataSettingsSectionProps) {
  const draftStatusText = getDraftStatusText(isSelectedTopicArchived, isDraftDirty);

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-medium text-slate-900">Метаданные теста</p>
      <p className="mt-1 text-sm text-slate-600">
        Редактирование названия и описания версии в работе.
      </p>
      <div className="mt-3 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="settings-draft-title">Название теста</Label>
          <Input
            id="settings-draft-title"
            value={draftForm.title}
            disabled={isSelectedTopicArchived}
            onChange={(event) => onDraftTitleChange(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="settings-draft-description">Описание теста</Label>
          <Textarea
            id="settings-draft-description"
            rows={3}
            value={draftForm.description}
            disabled={isSelectedTopicArchived}
            onChange={(event) => onDraftDescriptionChange(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={onSaveDraft}
            disabled={isSelectedTopicArchived || !isDraftDirty || isSavingDraft}
          >
            {isSavingDraft ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
          <p className="text-xs text-slate-500">{draftStatusText}</p>
        </div>
        {autosaveHint ? <p className="text-xs text-slate-500">{autosaveHint}</p> : null}
        {autoSaveError ? (
          <p className="text-xs text-red-700">Автосохранение не удалось: {autoSaveError}</p>
        ) : null}
      </div>
    </div>
  );
}

function PublishedSnapshotSection({ published }: { published: PublishedVersion | null }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-medium text-slate-900">Опубликованный срез</p>
      {published ? (
        <div className="mt-2 space-y-1 text-sm text-slate-700">
          <p>
            Версия: <span className="font-medium">v{published.versionNumber}</span>
          </p>
          <p>
            Название: <span className="font-medium">{published.title}</span>
          </p>
        </div>
      ) : (
        <p className="mt-1 text-sm text-slate-600">Тест еще не опубликован.</p>
      )}
    </div>
  );
}

function PublishSection({
  published,
  isSelectedTopicArchived,
  canPublish,
  isPublishing,
  onRequestPublish,
}: PublishSectionProps) {
  const publishButtonLabel = getPublishButtonLabel(isPublishing, published);
  const publishHintText = getPublishHintText(isSelectedTopicArchived, canPublish);

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-medium text-slate-900">Публикация</p>
      <p className="mt-1 text-sm text-slate-600">
        Публикация запускается через подтверждение и создает новый черновик для дальнейших правок.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onRequestPublish}
          disabled={isSelectedTopicArchived || !canPublish || isPublishing}
        >
          {publishButtonLabel}
        </Button>
        {publishHintText ? <p className="text-xs text-amber-700">{publishHintText}</p> : null}
      </div>
    </div>
  );
}

function ActivitySwitchSection({
  isSelectedTopicArchived,
  isArchivingTopic,
  isRestoringTopic,
  onToggleTopicActive,
}: ActivitySwitchSectionProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-medium text-slate-900">Переключатель активности</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-700">Активен для студентов</p>
          <p className="text-xs text-slate-500">
            Если выключить, тест уйдет в архив. Для возобновления включите обратно.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={!isSelectedTopicArchived}
          disabled={isArchivingTopic || isRestoringTopic}
          aria-label="Переключатель активности теста"
          onClick={onToggleTopicActive}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isSelectedTopicArchived ? 'bg-slate-300' : 'bg-emerald-500'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
              isSelectedTopicArchived ? 'translate-x-1' : 'translate-x-5'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export function AdminTestsSettingsCard({
  published,
  draftForm,
  isDraftDirty,
  isSelectedTopicArchived,
  canPublish,
  isSavingDraft,
  autoSaveError,
  autosaveHint,
  isPublishing,
  isArchivingTopic,
  isRestoringTopic,
  onBackToQuestions,
  onDraftTitleChange,
  onDraftDescriptionChange,
  onSaveDraft,
  onRequestPublish,
  onToggleTopicActive,
}: AdminTestsSettingsCardProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Настройки теста</CardTitle>
            <CardDescription>
              Изменение метаданных черновика и управление публикацией
            </CardDescription>
          </div>
          <button
            type="button"
            onClick={onBackToQuestions}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← К вопросам
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <MetadataSettingsSection
          draftForm={draftForm}
          isDraftDirty={isDraftDirty}
          isSelectedTopicArchived={isSelectedTopicArchived}
          isSavingDraft={isSavingDraft}
          autoSaveError={autoSaveError}
          autosaveHint={autosaveHint}
          onDraftTitleChange={onDraftTitleChange}
          onDraftDescriptionChange={onDraftDescriptionChange}
          onSaveDraft={onSaveDraft}
        />
        <PublishedSnapshotSection published={published} />
        <PublishSection
          published={published}
          isSelectedTopicArchived={isSelectedTopicArchived}
          canPublish={canPublish}
          isPublishing={isPublishing}
          onRequestPublish={onRequestPublish}
        />
        <ActivitySwitchSection
          isSelectedTopicArchived={isSelectedTopicArchived}
          isArchivingTopic={isArchivingTopic}
          isRestoringTopic={isRestoringTopic}
          onToggleTopicActive={onToggleTopicActive}
        />
      </CardContent>
    </Card>
  );
}
