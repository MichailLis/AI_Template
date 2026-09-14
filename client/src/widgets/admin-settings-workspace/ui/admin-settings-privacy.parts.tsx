import { Save } from 'lucide-react';

import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { RuDateInput } from '@/shared/ui/ru-date-input';
import { Textarea } from '@/shared/ui/textarea';

import { formatUpdatedAt } from './admin-settings-cards.model';

import type { PrivacyPolicySettings } from './admin-settings-cards.model';
import type { FormEvent } from 'react';

export function PrivacyPolicyStatusPanel({
  privacyPolicy,
}: {
  privacyPolicy: PrivacyPolicySettings;
}) {
  return (
    <div
      className={`grid gap-3 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem] ${adminClassNames.panel.loading}`}
    >
      <div>
        <p className={adminClassNames.text.kicker}>Версия</p>
        <p className={`mt-1 font-medium ${adminClassNames.text.heading}`}>
          {privacyPolicy.version}
        </p>
      </div>
      <div>
        <p className={adminClassNames.text.kicker}>Опубликована</p>
        <p className={`mt-1 font-medium ${adminClassNames.text.heading}`}>
          {formatUpdatedAt(privacyPolicy.publishedAt)}
        </p>
      </div>
      <div>
        <p className={adminClassNames.text.kicker}>Обновлена</p>
        <p className={`mt-1 font-medium ${adminClassNames.text.heading}`}>
          {formatUpdatedAt(privacyPolicy.updatedAt)}
        </p>
      </div>
    </div>
  );
}

interface PrivacyPolicyFormProps {
  canSubmit: boolean;
  content: string;
  isOldDateWithNewContent?: boolean;
  isSaving: boolean;
  operatorFullName: string;
  publishedAt: string;
  version: string;
  onContentChange: (value: string) => void;
  onOperatorFullNameChange: (value: string) => void;
  onPublishedAtChange: (value: string) => void;
  onPublishedAtValidityChange?: (isValid: boolean) => void;
  onSetCurrentDate?: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onVersionChange: (value: string) => void;
}

export function PrivacyPolicyForm({
  canSubmit,
  content,
  isOldDateWithNewContent = false,
  isSaving,
  operatorFullName,
  publishedAt,
  version,
  onContentChange,
  onOperatorFullNameChange,
  onPublishedAtChange,
  onPublishedAtValidityChange,
  onSetCurrentDate,
  onSubmit,
  onVersionChange,
}: PrivacyPolicyFormProps) {
  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="privacy-policy-version">Версия политики</Label>
          <Input
            id="privacy-policy-version"
            value={version}
            onChange={(event) => onVersionChange(event.target.value)}
            placeholder="2026-07-09"
            autoComplete="off"
          />
          {!version.trim() ? (
            <p className="text-xs font-medium text-destructive">
              Укажите номер или идентификатор версии.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="privacy-policy-published-at">Дата публикации</Label>
            {onSetCurrentDate ? (
              <button
                type="button"
                onClick={onSetCurrentDate}
                className="text-xs font-medium text-primary hover:underline"
              >
                Поставить текущую дату
              </button>
            ) : null}
          </div>
          <RuDateInput
            id="privacy-policy-published-at"
            mode="datetime"
            value={publishedAt}
            onChange={onPublishedAtChange}
            onValidityChange={onPublishedAtValidityChange}
          />
          {isOldDateWithNewContent ? (
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Внимание: редакция изменена, но дата публикации осталась прежней. Рекомендуется
              обновить дату.
            </p>
          ) : (
            <p className={adminClassNames.form.fieldHint}>
              Дата и время вступления редакции в силу на странице /privacy.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="privacy-policy-operator-full-name">
          Наименование оператора персональных данных
        </Label>
        <Input
          id="privacy-policy-operator-full-name"
          value={operatorFullName}
          onChange={(event) => onOperatorFullNameChange(event.target.value)}
          maxLength={512}
          autoComplete="organization"
        />
        <p className={adminClassNames.form.fieldHint}>
          Отображается в публичных тестах, где оператором персональных данных выступает платформа.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="privacy-policy-content">Текст политики</Label>
        <Textarea
          id="privacy-policy-content"
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          className="min-h-[360px] font-mono text-sm leading-6"
          spellCheck={false}
        />
        {!content.trim() ? (
          <p className="text-xs font-medium text-destructive">
            Текст политики обязателен для сохранения и публикации.
          </p>
        ) : (
          <p className={adminClassNames.form.fieldHint}>
            Этот текст публикуется на странице /privacy и используется как текущая редакция для
            новых попыток тестирования.
          </p>
        )}
      </div>

      <Button type="submit" disabled={!canSubmit}>
        <Save className="h-4 w-4" />
        {isSaving ? 'Сохраняем...' : 'Сохранить политику'}
      </Button>
    </form>
  );
}
