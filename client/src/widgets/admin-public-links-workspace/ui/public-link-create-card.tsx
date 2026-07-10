import { Link2 } from 'lucide-react';

import { adminClassNames, adminToneClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

import { PublicLinkAccessSettingsSection } from './public-link-access-settings-section';
import { PublicLinkOrganizationSection } from './public-link-organization-section';
import { PublicLinkTopicSection } from './public-link-topic-section';

import type { PublicLinkCreateCardProps } from './public-link-create-card.types';

interface PublicLinkCreateDialogProps extends PublicLinkCreateCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PublicLinkCreateHeader() {
  return (
    <DialogHeader>
      <div className="flex items-start gap-3">
        <div
          className={`grid size-10 shrink-0 place-items-center rounded-xl ${adminToneClassNames.info.icon}`}
        >
          <Link2 className="size-5" />
        </div>
        <div className="min-w-0">
          <DialogTitle>Создать публичную ссылку</DialogTitle>
          <DialogDescription>
            Выберите опубликованный тест, привяжите заведение и настройте доступ.
          </DialogDescription>
        </div>
      </div>
    </DialogHeader>
  );
}

export function PublicLinkCreateDialog({
  open,
  onOpenChange,
  topics,
  educationOrganizations,
  effectiveSelectedTopicId,
  onSelectTopic,
  newEducationOrganizationId,
  onEducationOrganizationSelect,
  newPersonalDataProcessingMode,
  onPersonalDataProcessingModeChange,
  newEducationOrganizationName,
  onEducationOrganizationNameChange,
  groupValidationMode,
  onGroupValidationModeChange,
  groupValidationPattern,
  onGroupValidationPatternChange,
  groupValidationExample,
  onGroupValidationExampleChange,
  groupValidationHint,
  onGroupValidationHintChange,
  onCreateEducationOrganization,
  onUpdateEducationOrganization,
  isCreatingEducationOrganization,
  isUpdatingEducationOrganization,
  newPublicShortCode,
  onShortCodeChange,
  newPublicTemplate,
  onPublicTemplateChange,
  newPublicEntryProfileMode,
  onEntryProfileModeChange,
  newPublicMaxAttempts,
  onMaxAttemptsChange,
  newPublicTimeLimit,
  onTimeLimitChange,
  newPublicConsentVersion,
  onConsentVersionChange,
  newPublicConsentText,
  onConsentTextChange,
  newPublicAllowResume,
  onAllowResumeChange,
  onCreatePublicLink,
  isCreatingPublicLink,
  hasPublishedVersion,
}: PublicLinkCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`left-4 right-4 top-4 max-h-[calc(100vh-2rem)] w-auto max-w-none translate-x-0 translate-y-0 overflow-y-auto p-4 sm:left-[50%] sm:right-auto sm:w-[calc(100vw-2rem)] sm:max-w-2xl sm:translate-x-[-50%] sm:p-6 ${adminClassNames.dialog.content}`}
      >
        <PublicLinkCreateHeader />

        <div className="grid gap-4">
          <PublicLinkTopicSection
            topics={topics}
            effectiveSelectedTopicId={effectiveSelectedTopicId}
            onSelectTopic={onSelectTopic}
          />

          <PublicLinkOrganizationSection
            educationOrganizations={educationOrganizations}
            newEducationOrganizationId={newEducationOrganizationId}
            onEducationOrganizationSelect={onEducationOrganizationSelect}
            newPersonalDataProcessingMode={newPersonalDataProcessingMode}
            onPersonalDataProcessingModeChange={onPersonalDataProcessingModeChange}
            newEducationOrganizationName={newEducationOrganizationName}
            onEducationOrganizationNameChange={onEducationOrganizationNameChange}
            groupValidationMode={groupValidationMode}
            onGroupValidationModeChange={onGroupValidationModeChange}
            groupValidationPattern={groupValidationPattern}
            onGroupValidationPatternChange={onGroupValidationPatternChange}
            groupValidationExample={groupValidationExample}
            onGroupValidationExampleChange={onGroupValidationExampleChange}
            groupValidationHint={groupValidationHint}
            onGroupValidationHintChange={onGroupValidationHintChange}
            onCreateEducationOrganization={onCreateEducationOrganization}
            onUpdateEducationOrganization={onUpdateEducationOrganization}
            isCreatingEducationOrganization={isCreatingEducationOrganization}
            isUpdatingEducationOrganization={isUpdatingEducationOrganization}
          />

          <PublicLinkAccessSettingsSection
            newPublicShortCode={newPublicShortCode}
            onShortCodeChange={onShortCodeChange}
            newPublicTemplate={newPublicTemplate}
            onPublicTemplateChange={onPublicTemplateChange}
            newPublicEntryProfileMode={newPublicEntryProfileMode}
            onEntryProfileModeChange={onEntryProfileModeChange}
            newPublicMaxAttempts={newPublicMaxAttempts}
            onMaxAttemptsChange={onMaxAttemptsChange}
            newPublicTimeLimit={newPublicTimeLimit}
            onTimeLimitChange={onTimeLimitChange}
            newPublicConsentVersion={newPublicConsentVersion}
            onConsentVersionChange={onConsentVersionChange}
            newPublicConsentText={newPublicConsentText}
            onConsentTextChange={onConsentTextChange}
            newPublicAllowResume={newPublicAllowResume}
            onAllowResumeChange={onAllowResumeChange}
          />

          {!hasPublishedVersion ? (
            <p className={adminClassNames.panel.warningInline}>
              У выбранного теста нет опубликованной версии. Опубликуйте тест, чтобы создать
              публичную ссылку.
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:space-x-0 [&>button]:w-full sm:[&>button]:w-auto">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            type="button"
            onClick={onCreatePublicLink}
            disabled={isCreatingPublicLink || !hasPublishedVersion}
          >
            {isCreatingPublicLink ? 'Создаем...' : 'Создать ссылку'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
