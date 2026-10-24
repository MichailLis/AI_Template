import { Controller, useWatch } from 'react-hook-form';

import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminSelectField } from '@/shared/ui/admin-select-field';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';

import type {
  CreatePublicLinkForm,
  PublicLinkOrganizationSectionProps,
} from './public-link-create-card.types';

function PersonalDataProcessingModeField({ form }: { form: CreatePublicLinkForm }) {
  return (
    <fieldset className="space-y-2 rounded-md border border-admin-border bg-admin-panel p-3">
      <legend className={`px-1 text-sm font-medium ${adminClassNames.text.heading}`}>
        Оператор персональных данных
      </legend>
      <label className={adminClassNames.form.checkboxLabel}>
        <input type="radio" value="PUBLIC" {...form.register('personalDataProcessingMode')} />
        Оператор — платформа
      </label>
      <label className={adminClassNames.form.checkboxLabel}>
        <input
          type="radio"
          value="ON_BEHALF_OF_EDUCATION_ORGANIZATION"
          {...form.register('personalDataProcessingMode')}
        />
        От имени учебного заведения
      </label>
      <p className={adminClassNames.form.fieldHint}>
        Оператор и ссылки на документы фиксируются при сохранении публичной ссылки.
      </p>
    </fieldset>
  );
}

/** Controller, а не register: после создания заведения id ставится раньше, чем появляется его option. */
function EducationOrganizationSelect({
  form,
  educationOrganizations,
}: Pick<PublicLinkOrganizationSectionProps, 'form' | 'educationOrganizations'>) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="education-organization">Заведение для ссылки</Label>
      <Controller
        control={form.control}
        name="educationOrganizationId"
        render={({ field }) => (
          <AdminSelectField
            id="education-organization"
            ref={field.ref}
            name={field.name}
            onBlur={field.onBlur}
            value={field.value ? String(field.value) : ''}
            onChange={(event) => {
              const value = event.target.value;
              field.onChange(value ? Number.parseInt(value, 10) : null);
            }}
            className="flex"
          >
            <option value="">Не привязывать (студент заполнит сам)</option>
            {educationOrganizations
              .filter((organization) => organization.isActive || organization.id === field.value)
              .map((organization) => (
                <option
                  key={organization.id}
                  value={organization.id}
                  disabled={!organization.isActive}
                >
                  {`${organization.name} — ${organization.personalDataReady ? 'ПДн готовы' : 'ПДн не готовы'}${organization.isActive ? '' : ' (отключено)'}`}
                </option>
              ))}
          </AdminSelectField>
        )}
      />
    </div>
  );
}

export function PublicLinkOrganizationSection({
  form,
  educationOrganizations,
  onCreateEducationOrganization,
  onEditEducationOrganization,
}: PublicLinkOrganizationSectionProps) {
  const [personalDataProcessingMode, educationOrganizationId] = useWatch({
    control: form.control,
    name: ['personalDataProcessingMode', 'educationOrganizationId'],
  });

  return (
    <div className={adminClassNames.panel.compactSection}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={`text-sm font-medium ${adminClassNames.text.heading}`}>Учебное заведение</p>
          <p className={`mt-1 text-sm ${adminClassNames.text.body}`}>
            Привяжите ссылку к заведению, если студентам не нужно вводить его вручную.
          </p>
        </div>
        <Badge variant="outline" className={adminBadgeClassNames.success}>
          Валидация групп
        </Badge>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <PersonalDataProcessingModeField form={form} />
        <EducationOrganizationSelect form={form} educationOrganizations={educationOrganizations} />
        {personalDataProcessingMode === 'PUBLIC' ? (
          <p className={adminClassNames.form.fieldHint}>
            Выбор заведения для анкеты не меняет оператора персональных данных: оператором остается
            платформа.
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onCreateEducationOrganization}>
            Новое заведение
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onEditEducationOrganization}
            disabled={!educationOrganizationId}
          >
            Изменить заведение
          </Button>
        </div>
        <p className={adminClassNames.form.fieldHint}>
          Реквизиты и формат поля «Группа / класс» настраиваются в карточке заведения.
        </p>
      </div>
    </div>
  );
}
