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
