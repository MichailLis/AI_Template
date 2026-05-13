import { cn } from '@/shared/lib/utils';
import {
  adminBadgeClassNames,
  adminClassNames,
  adminToneClassNames,
} from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
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
        <div
          className={`mt-3 grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] ${adminClassNames.panel.mutedSection}`}
        >
          <Badge variant="outline" className={adminBadgeClassNames.success}>
            v{published.versionNumber}
          </Badge>
          <div className="min-w-0 text-sm">
            <p className={`truncate font-medium ${adminClassNames.text.heading}`}>
              {published.title}
            </p>
            <p className={`mt-1 truncate ${adminClassNames.text.body}`}>
              Анализ:{' '}
              {published.analysisPromptVersion
                ? `${published.analysisPromptVersion.promptTitle} v${published.analysisPromptVersion.versionNumber}`
                : 'не подключен'}
            </p>
          </div>
        </div>
      ) : (
        <p className={`mt-1 text-sm ${adminClassNames.text.body}`}>Тест еще не опубликован.</p>
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
      <div
        className={`mt-3 flex flex-wrap items-center justify-between gap-2 ${adminClassNames.panel.mutedSection}`}
      >
        <Button
          type="button"
          variant="secondary"
          onClick={onRequestPublish}
          disabled={isSelectedTopicArchived || !canPublish || isPublishing}
        >
          {publishButtonLabel}
        </Button>
        {publishHintText ? (
          <p className={`text-xs ${adminToneClassNames.warning.text}`}>{publishHintText}</p>
        ) : null}
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
      <div
        className={`mt-3 flex flex-wrap items-center justify-between gap-3 ${adminClassNames.panel.mutedSection}`}
      >
        <div className="min-w-0">
          <p className={`text-sm ${adminClassNames.text.body}`}>Активен для студентов</p>
          <p className={adminClassNames.form.fieldHint}>
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
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            isSelectedTopicArchived
              ? adminClassNames.switch.inactive
              : adminClassNames.switch.active,
          )}
        >
          <span
            className={`${adminClassNames.switch.thumb} ${
              isSelectedTopicArchived ? 'translate-x-1' : 'translate-x-5'
            }`}
          />
        </button>
      </div>
    </AdminTestsSettingsPanel>
  );
}
