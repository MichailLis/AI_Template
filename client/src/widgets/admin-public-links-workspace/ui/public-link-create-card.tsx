import { adminClassNames } from '@/shared/ui/admin-design-tokens';
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

export function PublicLinkCreateDialog({
  open,
  onOpenChange,
  topics,
  educationOrganizations,
  effectiveSelectedTopicId,
  onSelectTopic,
  newEducationOrganizationId,
  onEducationOrganizationSelect,
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
        className={`max-h-[85vh] max-w-2xl overflow-y-auto ${adminClassNames.dialog.content}`}
      >
        <DialogHeader>
          <DialogTitle>Создать публичную ссылку</DialogTitle>
          <DialogDescription>
            Выберите опубликованный тест, привяжите заведение и настройте доступ.
          </DialogDescription>
        </DialogHeader>

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

        <DialogFooter className="gap-2 sm:space-x-0">
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
