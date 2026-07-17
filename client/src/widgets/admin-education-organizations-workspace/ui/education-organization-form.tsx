import { CheckCircle2, Circle } from 'lucide-react';
import { useWatch } from 'react-hook-form';

import { GROUP_VALIDATION_MODE_OPTIONS } from '@/shared/lib/group-validation';
import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminSelectField } from '@/shared/ui/admin-select-field';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';

import {
  getPersonalDataReadiness,
  type EducationOrganizationFormValues,
  type OrganizationEditorMode,
} from './education-organization-form.schema';

import type { UseFormReturn } from 'react-hook-form';

type TextFieldName = Exclude<
  keyof EducationOrganizationFormValues,
  'isActive' | 'groupValidationMode'
>;

interface EducationOrganizationFormProps {
  form: UseFormReturn<EducationOrganizationFormValues>;
  mode: OrganizationEditorMode;
  disabled?: boolean;
}

interface OrganizationTextFieldProps {
  form: UseFormReturn<EducationOrganizationFormValues>;
  name: TextFieldName;
  label: string;
  placeholder: string;
  disabled: boolean;
  required?: boolean;
  type?: 'text' | 'url' | 'email' | 'tel';
  autoComplete?: string;
  className?: string;
  description?: string;
}

function OrganizationTextField({
  form,
  name,
  label,
  placeholder,
  disabled,
  required = false,
  type = 'text',
  autoComplete = 'off',
  className,
  description,
}: OrganizationTextFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{required ? `${label} *` : label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              value={field.value}
              type={type}
              autoComplete={autoComplete}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
            />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

const sectionClassName = 'space-y-4 border-b border-admin-border pb-6 last:border-b-0 last:pb-0';
const legendClassName = 'mb-4 text-sm font-semibold text-admin-foreground';

type FormSectionProps = Pick<EducationOrganizationFormProps, 'form'> & {
  disabled: boolean;
};

function PersonalDataReadiness({ values }: { values: EducationOrganizationFormValues }) {
  const readiness = getPersonalDataReadiness(values);
  const items = [
    { label: 'Полное наименование', ready: Boolean(values.fullName.trim()) },
    { label: 'Сокращённое наименование', ready: Boolean(values.shortName.trim()) },
    { label: 'Политика обработки ПДн', ready: Boolean(values.privacyPolicyUrl.trim()) },
  ];

  return (
    <div
      className="rounded-md border border-admin-border bg-admin-panel-muted/40 p-3"
      aria-live="polite"
    >
      <p className="text-sm font-medium text-admin-foreground">
        {`Готовность ПДн: ${readiness.completed} из ${readiness.total}`}
      </p>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
        {items.map((item) => {
          const Icon = item.ready ? CheckCircle2 : Circle;
          return (
            <span
              key={item.label}
              className={
                item.ready
                  ? 'flex gap-1.5 text-xs text-admin-success-foreground'
                  : 'flex gap-1.5 text-xs text-admin-muted'
              }
            >
              <Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {item.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function MainDataSection({
  form,
  mode,
  disabled,
}: FormSectionProps & { mode: OrganizationEditorMode }) {
  return (
    <fieldset className={sectionClassName} disabled={disabled}>
      <legend className={legendClassName}>Основные данные</legend>
      <OrganizationTextField
        form={form}
        name="name"
        label="Название"
        placeholder="Например: Лицей № 42"
        autoComplete="organization"
        required
        disabled={disabled}
      />

      {mode === 'edit' ? (
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem>
              <label className={adminClassNames.form.checkboxLabel}>
                <input
                  ref={field.ref}
                  type="checkbox"
                  checked={field.value}
                  onBlur={field.onBlur}
                  onChange={(event) => field.onChange(event.target.checked)}
                  disabled={disabled}
                />
                Заведение активно
              </label>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
    </fieldset>
  );
}

function OperatorSection({ form, disabled }: FormSectionProps) {
  const values = useWatch({
    control: form.control,
    defaultValue: form.getValues(),
  }) as EducationOrganizationFormValues;

  return (
    <fieldset className={sectionClassName} disabled={disabled}>
      <legend className={legendClassName}>Оператор персональных данных</legend>
      <PersonalDataReadiness values={values} />
      <p className="text-xs text-admin-muted">
        Эти поля не блокируют сохранение. Заполните все три, чтобы организация была готова к
        обработке персональных данных.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <OrganizationTextField
          form={form}
          name="fullName"
          label="Полное наименование"
          placeholder="Например: Муниципальное автономное общеобразовательное учреждение «Лицей № 42»"
          autoComplete="organization"
          className="sm:col-span-2"
          disabled={disabled}
        />
        <OrganizationTextField
          form={form}
          name="shortName"
          label="Сокращённое наименование"
          placeholder="Например: МАОУ «Лицей № 42»"
          autoComplete="organization"
          disabled={disabled}
        />
      </div>
    </fieldset>
  );
}

function DocumentsSection({ form, disabled }: FormSectionProps) {
  return (
    <fieldset className={sectionClassName} disabled={disabled}>
      <legend className={legendClassName}>Документы и оформление</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <OrganizationTextField
          form={form}
          name="privacyPolicyUrl"
          label="Политика обработки ПДн"
          placeholder="https://school.example/privacy"
          type="url"
          disabled={disabled}
        />
        <OrganizationTextField
          form={form}
          name="consentDocumentUrl"
          label="Документ согласия"
          placeholder="https://school.example/consent"
          type="url"
          disabled={disabled}
        />
        <OrganizationTextField
          form={form}
          name="logoUrl"
          label="Логотип"
          placeholder="https://school.example/logo.svg"
          type="url"
          className="sm:col-span-2"
          disabled={disabled}
        />
      </div>
    </fieldset>
  );
}

function ContactsSection({ form, disabled }: FormSectionProps) {
  return (
    <fieldset className={sectionClassName} disabled={disabled}>
      <legend className={legendClassName}>Контакты и реквизиты</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <OrganizationTextField
          form={form}
          name="inn"
          label="ИНН"
          placeholder="Например: 1234567890"
          disabled={disabled}
        />
        <OrganizationTextField
          form={form}
          name="ogrn"
          label="ОГРН"
          placeholder="Например: 1234567890123"
          disabled={disabled}
        />
        <OrganizationTextField
          form={form}
          name="legalAddress"
          label="Юридический адрес"
          placeholder="Например: г. Казань, ул. Школьная, д. 1"
          autoComplete="street-address"
          className="sm:col-span-2"
          disabled={disabled}
        />
        <OrganizationTextField
          form={form}
          name="email"
          label="Email"
          placeholder="Например: office@school.example"
          type="email"
          autoComplete="email"
          disabled={disabled}
        />
        <OrganizationTextField
          form={form}
          name="phone"
          label="Телефон"
          placeholder="Например: +7 900 000-00-00"
          type="tel"
          autoComplete="tel"
          disabled={disabled}
        />
      </div>
    </fieldset>
  );
}

function ValidationSection({ form, disabled }: FormSectionProps) {
  const validationMode = useWatch({ control: form.control, name: 'groupValidationMode' });

  return (
    <fieldset className={sectionClassName} disabled={disabled}>
      <legend className={legendClassName}>Проверка группы/класса</legend>
      <FormField
        control={form.control}
        name="groupValidationMode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Режим проверки</FormLabel>
            <FormControl>
              <AdminSelectField {...field} disabled={disabled} className="flex">
                {GROUP_VALIDATION_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </AdminSelectField>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {validationMode !== 'NONE' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <OrganizationTextField
            form={form}
            name="groupValidationPattern"
            label="Шаблон (RegExp)"
            placeholder="Например: ^[А-ЯA-Z]{2,4}-?\\d{1,3}[А-ЯA-Z]?$"
            className="sm:col-span-2"
            required
            disabled={disabled}
          />
          <OrganizationTextField
            form={form}
            name="groupValidationExample"
            label="Пример"
            placeholder="Например: ИС-21"
            disabled={disabled}
          />
          <OrganizationTextField
            form={form}
            name="groupValidationHint"
            label="Подсказка для студента"
            placeholder="Например: Укажите формат ИС-21"
            disabled={disabled}
          />
        </div>
      ) : null}
    </fieldset>
  );
}

export function EducationOrganizationForm({
  form,
  mode,
  disabled = false,
}: EducationOrganizationFormProps) {
  return (
    <div className="space-y-6">
      <MainDataSection form={form} mode={mode} disabled={disabled} />
      <OperatorSection form={form} disabled={disabled} />
      <DocumentsSection form={form} disabled={disabled} />
      <ContactsSection form={form} disabled={disabled} />
      <ValidationSection form={form} disabled={disabled} />
    </div>
  );
}
