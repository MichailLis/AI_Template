import { Button } from '@/shared/ui/button';

import { AdminTestsSettingsPanel } from './admin-tests-settings-panel';

import type { AnalysisPromptVersionSummary } from './admin-tests-analysis-prompt-settings-section';

export interface PublishedVersion {
  versionNumber: number;
  title: string;
  analysisPromptVersion: AnalysisPromptVersionSummary | null;
}

interface AdminTestsPublishSectionProps {
  published: PublishedVersion | null;
  isSelectedTopicArchived: boolean;
  canPublish: boolean;
  isPublishing: boolean;
  onRequestPublish: () => void;
}

interface AdminTestsActivitySwitchSectionProps {
  isSelectedTopicArchived: boolean;
  isArchivingTopic: boolean;
  isRestoringTopic: boolean;
  onToggleTopicActive: () => void;
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

export function AdminTestsPublishedSnapshotSection({
  published,
}: {
  published: PublishedVersion | null;
}) {
  return (
    <AdminTestsSettingsPanel title="Опубликованный срез">
      {published ? (
        <div className="mt-2 space-y-1 text-sm text-slate-700">
          <p>
            Версия: <span className="font-medium">v{published.versionNumber}</span>
          </p>
          <p>
            Название: <span className="font-medium">{published.title}</span>
          </p>
          <p>
            Анализ:{' '}
            <span className="font-medium">
              {published.analysisPromptVersion
                ? `${published.analysisPromptVersion.promptTitle} v${published.analysisPromptVersion.versionNumber}`
                : 'не подключен'}
            </span>
          </p>
        </div>
      ) : (
        <p className="mt-1 text-sm text-slate-600">Тест еще не опубликован.</p>
      )}
    </AdminTestsSettingsPanel>
  );
}

export function AdminTestsPublishSection({
  published,
  isSelectedTopicArchived,
  canPublish,
  isPublishing,
  onRequestPublish,
}: AdminTestsPublishSectionProps) {
  const publishButtonLabel = getPublishButtonLabel(isPublishing, published);
  const publishHintText = getPublishHintText(isSelectedTopicArchived, canPublish);

  return (
    <AdminTestsSettingsPanel
      title="Публикация"
      description="Публикация запускается через подтверждение и создает новый черновик для дальнейших правок."
    >
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
    </AdminTestsSettingsPanel>
  );
}

export function AdminTestsActivitySwitchSection({
  isSelectedTopicArchived,
  isArchivingTopic,
  isRestoringTopic,
  onToggleTopicActive,
}: AdminTestsActivitySwitchSectionProps) {
  return (
    <AdminTestsSettingsPanel title="Переключатель активности">
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
    </AdminTestsSettingsPanel>
  );
}
