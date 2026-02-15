import { Link } from 'react-router-dom';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import { PublicLinkAccessSettingsSection } from './public-link-access-settings-section';
import { PublicLinkOrganizationSection } from './public-link-organization-section';
import { PublicLinkTopicSection } from './public-link-topic-section';

import type { PublicLinkCreateCardProps } from './public-link-create-card.types';

export function PublicLinkCreateCard({
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
}: PublicLinkCreateCardProps) {
  return (
    <Card className="h-full border-slate-200">
      <CardHeader className="space-y-2">
        <CardTitle className="text-base">Параметры новой ссылки</CardTitle>
        <CardDescription>Выберите тест и настройте доступ для студентов.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
        />

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={newPublicAllowResume}
            onChange={(event) => onAllowResumeChange(event.target.checked)}
          />
          Разрешить возобновление
        </label>

        <Button
          type="button"
          onClick={onCreatePublicLink}
          disabled={isCreatingPublicLink || !hasPublishedVersion}
          className="w-full"
        >
          {isCreatingPublicLink ? 'Создаем...' : 'Создать ссылку'}
        </Button>

        <div className="grid gap-2">
          <Button asChild type="button" variant="outline" className="w-full">
            <Link to="/admin/public-links/organizations">Учебные заведения</Link>
          </Button>
          <Button asChild type="button" variant="outline" className="w-full">
            <Link to="/admin/public-links/stats">Открыть статистику</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
