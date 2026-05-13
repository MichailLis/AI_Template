import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import type { PublicLinkAccessSettingsSectionProps } from './public-link-create-card.types';

export function PublicLinkAccessSettingsSection({
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="public-max-attempts">Лимит попыток</Label>
            <Input
              id="public-max-attempts"
              type="number"
              min={1}
              value={newPublicMaxAttempts}
              onChange={(event) => onMaxAttemptsChange(event.target.value)}
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
        </div>

        <label className={adminClassNames.form.checkboxLabel}>
          <input
            type="checkbox"
            checked={newPublicAllowResume}
            onChange={(event) => onAllowResumeChange(event.target.checked)}
          />
          Разрешить студенту вернуться к незавершенной попытке
        </label>

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
      </div>
    </div>
  );
}
