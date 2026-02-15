import { Link } from 'react-router-dom';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

interface TopicOption {
  id: number;
  draftTitle: string;
}

interface EducationOrganizationOption {
  id: number;
  name: string;
  isActive: boolean;
}

interface PublicLinkCreateCardProps {
  topics: TopicOption[];
  educationOrganizations: EducationOrganizationOption[];
  effectiveSelectedTopicId: number;
  onSelectTopic: (topicId: number) => void;
  newEducationOrganizationId: number | null;
  onEducationOrganizationSelect: (organizationId: number | null) => void;
  newEducationOrganizationName: string;
  onEducationOrganizationNameChange: (value: string) => void;
  onCreateEducationOrganization: () => void;
  isCreatingEducationOrganization: boolean;
  newPublicShortCode: string;
  onShortCodeChange: (value: string) => void;
  newPublicMaxAttempts: string;
  onMaxAttemptsChange: (value: string) => void;
  newPublicTimeLimit: string;
  onTimeLimitChange: (value: string) => void;
  newPublicConsentVersion: string;
  onConsentVersionChange: (value: string) => void;
  newPublicConsentText: string;
  onConsentTextChange: (value: string) => void;
  newPublicAllowResume: boolean;
  onAllowResumeChange: (checked: boolean) => void;
  onCreatePublicLink: () => void;
  isCreatingPublicLink: boolean;
  hasPublishedVersion: boolean;
}

export function PublicLinkCreateCard({
  topics,
  educationOrganizations,
  effectiveSelectedTopicId,
  onSelectTopic,
  newEducationOrganizationId,
  onEducationOrganizationSelect,
  newEducationOrganizationName,
  onEducationOrganizationNameChange,
  onCreateEducationOrganization,
  isCreatingEducationOrganization,
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
        <div className="space-y-2">
          <Label htmlFor="public-topic">Тест</Label>
          <select
            id="public-topic"
            value={effectiveSelectedTopicId > 0 ? String(effectiveSelectedTopicId) : ''}
            onChange={(event) => {
              onSelectTopic(Number.parseInt(event.target.value, 10));
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={topics.length === 0}
          >
            {topics.length === 0 ? <option value="">Нет доступных тестов</option> : null}
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.draftTitle}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="education-organization">Учебное заведение</Label>
          <select
            id="education-organization"
            value={newEducationOrganizationId ? String(newEducationOrganizationId) : ''}
            onChange={(event) => {
              const value = event.target.value;
              onEducationOrganizationSelect(value ? Number.parseInt(value, 10) : null);
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Выберите учебное заведение</option>
            {educationOrganizations
              .filter((organization) => organization.isActive)
              .map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
          </select>
          <div className="flex gap-2">
            <Input
              value={newEducationOrganizationName}
              onChange={(event) => onEducationOrganizationNameChange(event.target.value)}
              placeholder="Добавить новое заведение"
            />
            <Button
              type="button"
              variant="outline"
              onClick={onCreateEducationOrganization}
              disabled={isCreatingEducationOrganization}
            >
              {isCreatingEducationOrganization ? 'Добавляем...' : 'Добавить'}
            </Button>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="public-short-code">Короткий код (опционально)</Label>
            <Input
              id="public-short-code"
              value={newPublicShortCode}
              onChange={(event) => onShortCodeChange(event.target.value.toUpperCase())}
              placeholder="Например: TEST2026"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="public-max-attempts">Лимит попыток</Label>
              <Input
                id="public-max-attempts"
                type="number"
                min={1}
                value={newPublicMaxAttempts}
                onChange={(event) => onMaxAttemptsChange(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="public-time-limit">Лимит времени</Label>
              <Input
                id="public-time-limit"
                type="number"
                min={1}
                value={newPublicTimeLimit}
                onChange={(event) => onTimeLimitChange(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="public-consent-version">Версия согласия</Label>
            <Input
              id="public-consent-version"
              value={newPublicConsentVersion}
              onChange={(event) => onConsentVersionChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="public-consent-text">Текст согласия</Label>
            <Textarea
              id="public-consent-text"
              value={newPublicConsentText}
              onChange={(event) => onConsentTextChange(event.target.value)}
              className="min-h-20"
            />
          </div>
        </div>

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

        <Button asChild type="button" variant="outline" className="w-full">
          <Link to="/admin/public-links/stats">Открыть статистику</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
