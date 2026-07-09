import { Save } from 'lucide-react';

import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
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
  isSaving: boolean;
  publishedAt: string;
  version: string;
  onContentChange: (value: string) => void;
  onPublishedAtChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onVersionChange: (value: string) => void;
}

export function PrivacyPolicyForm({
  canSubmit,
  content,
  isSaving,
  publishedAt,
  version,
  onContentChange,
  onPublishedAtChange,
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
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="privacy-policy-published-at">Дата публикации</Label>
          <Input
            id="privacy-policy-published-at"
            type="datetime-local"
            value={publishedAt}
            onChange={(event) => onPublishedAtChange(event.target.value)}
          />
        </div>
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
        <p className={adminClassNames.form.fieldHint}>
          Этот текст публикуется на странице /privacy и используется как текущая редакция для новых
          попыток тестирования.
        </p>
      </div>

      <Button type="submit" disabled={!canSubmit}>
        <Save className="h-4 w-4" />
        {isSaving ? 'Сохраняем...' : 'Сохранить политику'}
      </Button>
    </form>
  );
}
