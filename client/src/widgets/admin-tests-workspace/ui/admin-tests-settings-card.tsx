import { ArrowLeft, Settings2 } from 'lucide-react';

import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import {
  AdminTestsAnalysisPromptSettingsSection,
  type AnalysisPromptVersionSummary,
} from './admin-tests-analysis-prompt-settings-section';
import {
  AdminTestsMetadataSettingsSection,
  type AdminTestsDraftForm,
} from './admin-tests-metadata-settings-section';
import {
  AdminTestsActivitySwitchSection,
  AdminTestsPublishedSnapshotSection,
  AdminTestsPublishSection,
  type PublishedVersion,
} from './admin-tests-publication-settings-section';

interface AdminTestsSettingsCardProps {
  published: PublishedVersion | null;
  draftAnalysisPromptVersion: AnalysisPromptVersionSummary | null;
  draftForm: AdminTestsDraftForm;
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
  onDraftAnalysisPromptVersionChange: (value: number | null) => void;
  onSaveDraft: () => void;
  onRequestPublish: () => void;
  onToggleTopicActive: () => void;
}

export function AdminTestsSettingsCard({
  published,
  draftAnalysisPromptVersion,
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
  onDraftAnalysisPromptVersionChange,
  onSaveDraft,
  onRequestPublish,
  onToggleTopicActive,
}: AdminTestsSettingsCardProps) {
  return (
    <Card className={adminClassNames.panel.card}>
      <CardHeader className={adminClassNames.border.bottom}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div
              className={`grid size-10 shrink-0 place-items-center rounded-xl ${adminClassNames.panel.compactSection}`}
            >
              <Settings2 className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>Настройки теста</CardTitle>
                <Badge
                  variant="outline"
                  className={
                    isSelectedTopicArchived
                      ? adminBadgeClassNames.neutral
                      : adminBadgeClassNames.success
                  }
                >
                  {isSelectedTopicArchived ? 'В архиве' : 'Активен'}
                </Badge>
                {isDraftDirty ? (
                  <Badge variant="outline" className={adminBadgeClassNames.warning}>
                    Есть правки
                  </Badge>
                ) : null}
              </div>
              <CardDescription>
                Метаданные, промпт анализа, публикация и доступность теста.
              </CardDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBackToQuestions}
            className="shrink-0"
          >
            <ArrowLeft className="mr-2 size-4" />К вопросам
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-4">
        <AdminTestsMetadataSettingsSection
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
        <AdminTestsAnalysisPromptSettingsSection
          selectedAnalysisPromptVersion={draftAnalysisPromptVersion}
          selectedAnalysisPromptVersionId={draftForm.analysisPromptVersionId}
          isSelectedTopicArchived={isSelectedTopicArchived}
          onDraftAnalysisPromptVersionChange={onDraftAnalysisPromptVersionChange}
        />
        <AdminTestsPublishedSnapshotSection published={published} />
        <AdminTestsPublishSection
          published={published}
          isSelectedTopicArchived={isSelectedTopicArchived}
          canPublish={canPublish}
          isPublishing={isPublishing}
          onRequestPublish={onRequestPublish}
        />
        <AdminTestsActivitySwitchSection
          isSelectedTopicArchived={isSelectedTopicArchived}
          isArchivingTopic={isArchivingTopic}
          isRestoringTopic={isRestoringTopic}
          onToggleTopicActive={onToggleTopicActive}
        />
      </CardContent>
    </Card>
  );
}
