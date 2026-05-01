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
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div>
        <p className="text-sm font-medium text-slate-900">Доступ</p>
        <p className="mt-1 text-sm text-slate-600">
          Базовые ограничения для прохождения по публичной ссылке.
        </p>
      </div>
      <div className="mt-3 grid gap-3">
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

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={newPublicAllowResume}
            onChange={(event) => onAllowResumeChange(event.target.checked)}
          />
          Разрешить студенту вернуться к незавершенной попытке
        </label>

        <details className="rounded-md border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer text-sm font-medium text-slate-900">
            Согласие на обработку данных
          </summary>
          <div className="mt-3 grid gap-3">
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
        </details>
      </div>
    </div>
  );
}
