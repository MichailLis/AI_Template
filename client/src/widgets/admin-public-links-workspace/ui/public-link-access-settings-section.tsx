import { useWatch } from 'react-hook-form';

import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminSelectField } from '@/shared/ui/admin-select-field';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import type { PublicLinkAccessSettingsSectionProps } from './public-link-create-card.types';

function PublicTemplateField({ form }: PublicLinkAccessSettingsSectionProps) {
  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <Label htmlFor="public-template">Шаблон публичного теста</Label>
      <AdminSelectField id="public-template" {...form.register('publicTemplate')}>
        <option value="STANDARD">Стандартный</option>
        <option value="POLUS">Polus</option>
      </AdminSelectField>
      <p className={`text-xs ${adminClassNames.text.muted}`}>
        Шаблон фиксируется при создании публичной ссылки.
      </p>
    </div>
  );
}

function EntryProfileModeField({ form }: PublicLinkAccessSettingsSectionProps) {
  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <Label htmlFor="public-entry-profile-mode">Анкета перед тестом</Label>
      <AdminSelectField id="public-entry-profile-mode" {...form.register('entryProfileMode')}>
        <option value="DEMOGRAPHIC">Демографическая анкета</option>
        <option value="EDUCATION">Анкета по учебным данным</option>
        <option value="EDUCATION_DEMOGRAPHIC">Учебные данные + демографическая анкета</option>
      </AdminSelectField>
      <p className={`text-xs ${adminClassNames.text.muted}`}>
        Для демографической анкеты лимит попыток устанавливается равным 1.
      </p>
    </div>
  );
}

function AttemptLimitFields({ form }: PublicLinkAccessSettingsSectionProps) {
  const entryProfileMode = useWatch({ control: form.control, name: 'entryProfileMode' });

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="public-max-attempts">Лимит попыток</Label>
        {/* Демографическая анкета всегда дает одну попытку; введенный лимит вернется при смене анкеты. */}
        {entryProfileMode === 'DEMOGRAPHIC' ? (
          <Input id="public-max-attempts" type="number" value="1" disabled readOnly />
        ) : (
          <Input id="public-max-attempts" type="number" min={1} {...form.register('maxAttempts')} />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="public-time-limit">Лимит времени</Label>
        <Input id="public-time-limit" type="number" min={1} {...form.register('timeLimit')} />
      </div>
    </>
  );
}

function ConsentDetails({ form }: PublicLinkAccessSettingsSectionProps) {
  return (
    <details className={adminClassNames.panel.compactCard}>
      <summary className={`cursor-pointer text-sm font-medium ${adminClassNames.text.heading}`}>
        Согласие на обработку данных
      </summary>
      <div className="mt-3 grid gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="public-consent-version">Версия согласия</Label>
          <Input id="public-consent-version" {...form.register('consentVersion')} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="public-consent-text">Текст согласия</Label>
          <Textarea
            id="public-consent-text"
            className="min-h-20"
            {...form.register('consentText')}
          />
        </div>
      </div>
    </details>
  );
}

export function PublicLinkAccessSettingsSection({ form }: PublicLinkAccessSettingsSectionProps) {
  const shortCodeField = form.register('shortCode');

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
            placeholder="Например: TEST2026"
            {...shortCodeField}
            onChange={(event) => {
              event.target.value = event.target.value.toUpperCase();
              void shortCodeField.onChange(event);
            }}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PublicTemplateField form={form} />
          <EntryProfileModeField form={form} />
          <AttemptLimitFields form={form} />
        </div>

        <label className={adminClassNames.form.checkboxLabel}>
          <input type="checkbox" {...form.register('allowResume')} />
          Разрешить студенту вернуться к незавершенной попытке
        </label>

        <ConsentDetails form={form} />
      </div>
    </div>
  );
}
