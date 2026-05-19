import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import type { PublicLinkAccessSettingsSectionProps } from './public-link-create-card.types';

type AccessSettingsProps = PublicLinkAccessSettingsSectionProps;

function PublicTemplateField({
  newPublicTemplate,
  onPublicTemplateChange,
}: Pick<AccessSettingsProps, 'newPublicTemplate' | 'onPublicTemplateChange'>) {
  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <Label htmlFor="public-template">Шаблон публичного теста</Label>
      <select
        id="public-template"
        value={newPublicTemplate}
        onChange={(event) => onPublicTemplateChange(event.target.value as typeof newPublicTemplate)}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="STANDARD">Текущий</option>
        <option value="POLUS">Polus</option>
      </select>
      <p className={`text-xs ${adminClassNames.text.muted}`}>
        Шаблон фиксируется при создании публичной ссылки.
      </p>
    </div>
  );
}

function EntryProfileModeField({
  newPublicEntryProfileMode,
  onEntryProfileModeChange,
}: Pick<AccessSettingsProps, 'newPublicEntryProfileMode' | 'onEntryProfileModeChange'>) {
  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <Label htmlFor="public-entry-profile-mode">Анкета перед тестом</Label>
      <select
        id="public-entry-profile-mode"
        value={newPublicEntryProfileMode}
        onChange={(event) =>
          onEntryProfileModeChange(event.target.value as typeof newPublicEntryProfileMode)
        }
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="DEMOGRAPHIC">Демографическая анкета</option>
        <option value="EDUCATION">Анкета по учебным данным</option>
        <option value="EDUCATION_DEMOGRAPHIC">Учебные данные + демографическая анкета</option>
      </select>
      <p className={`text-xs ${adminClassNames.text.muted}`}>
        Для демографической анкеты лимит попыток устанавливается равным 1.
      </p>
    </div>
  );
}

function AttemptLimitFields({
  newPublicEntryProfileMode,
  newPublicMaxAttempts,
  onMaxAttemptsChange,
  newPublicTimeLimit,
  onTimeLimitChange,
}: Pick<
  AccessSettingsProps,
  | 'newPublicEntryProfileMode'
  | 'newPublicMaxAttempts'
  | 'onMaxAttemptsChange'
  | 'newPublicTimeLimit'
  | 'onTimeLimitChange'
>) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="public-max-attempts">Лимит попыток</Label>
        <Input
          id="public-max-attempts"
          type="number"
          min={1}
          value={newPublicEntryProfileMode === 'DEMOGRAPHIC' ? '1' : newPublicMaxAttempts}
          onChange={(event) => onMaxAttemptsChange(event.target.value)}
          disabled={newPublicEntryProfileMode === 'DEMOGRAPHIC'}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="public-time-limit">Лимит времени</Label>
        <Input
          id="public-time-limit"
          type="number"
          min={1}
          value={newPublicTimeLimit}
          onChange={(event) => onTimeLimitChange(event.target.value)}
        />
      </div>
    </>
  );
}

function ConsentDetails({
  newPublicConsentVersion,
  onConsentVersionChange,
  newPublicConsentText,
  onConsentTextChange,
}: Pick<
  AccessSettingsProps,
  | 'newPublicConsentVersion'
  | 'onConsentVersionChange'
  | 'newPublicConsentText'
  | 'onConsentTextChange'
>) {
  return (
    <details className={adminClassNames.panel.compactCard}>
      <summary className={`cursor-pointer text-sm font-medium ${adminClassNames.text.heading}`}>
        Согласие на обработку данных
      </summary>
      <div className="mt-3 grid gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="public-consent-version">Версия согласия</Label>
          <Input
            id="public-consent-version"
            value={newPublicConsentVersion}
            onChange={(event) => onConsentVersionChange(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="public-consent-text">Текст согласия</Label>
          <Textarea
            id="public-consent-text"
            value={newPublicConsentText}
            onChange={(event) => onConsentTextChange(event.target.value)}
            className="min-h-20"
          />
        </div>
      </div>
    </details>
  );
}

export function PublicLinkAccessSettingsSection({
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
}: PublicLinkAccessSettingsSectionProps) {
  return (
    <div className={adminClassNames.panel.compactSection}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={`text-sm font-medium ${adminClassNames.text.heading}`}>Доступ</p>
          <p className={`mt-1 text-sm ${adminClassNames.text.body}`}>
            Базовые ограничения для прохождения по публичной ссылке.
          </p>
        </div>
        <Badge variant="outline" className={adminBadgeClassNames.neutral}>
          Правила попытки
        </Badge>
      </div>
      <div className="mt-3 grid gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="public-short-code">Короткий код (опционально)</Label>
          <Input
            id="public-short-code"
            value={newPublicShortCode}
            onChange={(event) => onShortCodeChange(event.target.value.toUpperCase())}
            placeholder="Например: TEST2026"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PublicTemplateField
            newPublicTemplate={newPublicTemplate}
            onPublicTemplateChange={onPublicTemplateChange}
          />
          <EntryProfileModeField
            newPublicEntryProfileMode={newPublicEntryProfileMode}
            onEntryProfileModeChange={onEntryProfileModeChange}
          />
          <AttemptLimitFields
            newPublicEntryProfileMode={newPublicEntryProfileMode}
            newPublicMaxAttempts={newPublicMaxAttempts}
            onMaxAttemptsChange={onMaxAttemptsChange}
            newPublicTimeLimit={newPublicTimeLimit}
            onTimeLimitChange={onTimeLimitChange}
          />
        </div>

        <label className={adminClassNames.form.checkboxLabel}>
          <input
            type="checkbox"
            checked={newPublicAllowResume}
            onChange={(event) => onAllowResumeChange(event.target.checked)}
          />
          Разрешить студенту вернуться к незавершенной попытке
        </label>

        <ConsentDetails
          newPublicConsentVersion={newPublicConsentVersion}
          onConsentVersionChange={onConsentVersionChange}
          newPublicConsentText={newPublicConsentText}
          onConsentTextChange={onConsentTextChange}
        />
      </div>
    </div>
  );
}
