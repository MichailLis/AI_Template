# Task 2 review package

Base: shared dirty working tree; target files are pre-existing untracked task files
Head: current working tree after Task 2 GREEN implementation

## Full file snapshot

Path: `client/src/widgets/admin-education-organizations-workspace/ui/education-organization-operator-fields.tsx`

```tsx
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

export interface EducationOrganizationOperatorValues {
  fullName: string;
  shortName: string;
  inn: string;
  ogrn: string;
  legalAddress: string;
  email: string;
  phone: string;
  privacyPolicyUrl: string;
  consentDocumentUrl: string;
  logoUrl: string;
}

export type EducationOrganizationOperatorField = keyof EducationOrganizationOperatorValues;

interface EducationOrganizationOperatorFieldsProps {
  idPrefix: string;
  values: EducationOrganizationOperatorValues;
  onChange: (field: EducationOrganizationOperatorField, value: string) => void;
  disabled?: boolean;
}

interface OperatorFieldConfig {
  field: EducationOrganizationOperatorField;
  label: string;
  placeholder: string;
  operatorRequired?: boolean;
  type?: 'text' | 'url';
  autoComplete?: string;
  className?: string;
}

const FIELD_GROUPS: Array<{ title: string; fields: OperatorFieldConfig[] }> = [
  {
    title: 'Оператор персональных данных',
    fields: [
      {
        field: 'fullName',
        label: 'Полное наименование',
        placeholder:
          'Например: Муниципальное автономное общеобразовательное учреждение «Лицей № 42»',
        operatorRequired: true,
        autoComplete: 'organization',
        className: 'sm:col-span-2',
      },
      {
        field: 'shortName',
        label: 'Сокращённое наименование',
        placeholder: 'Например: МАОУ «Лицей № 42»',
        operatorRequired: true,
        autoComplete: 'organization',
      },
    ],
  },
  {
    title: 'Контакты и реквизиты',
    fields: [
      { field: 'inn', label: 'ИНН', placeholder: 'Например: 1234567890' },
      { field: 'ogrn', label: 'ОГРН', placeholder: 'Например: 1234567890123' },
      {
        field: 'legalAddress',
        label: 'Юридический адрес',
        placeholder: 'Например: г. Казань, ул. Школьная, д. 1',
        autoComplete: 'street-address',
        className: 'sm:col-span-2',
      },
      {
        field: 'email',
        label: 'Email',
        placeholder: 'Например: office@school.example',
        autoComplete: 'email',
      },
      {
        field: 'phone',
        label: 'Телефон',
        placeholder: 'Например: +7 900 000-00-00',
        autoComplete: 'tel',
      },
    ],
  },
  {
    title: 'Документы и оформление',
    fields: [
      {
        field: 'privacyPolicyUrl',
        label: 'Политика обработки ПДн',
        placeholder: 'https://school.example/privacy',
        operatorRequired: true,
        type: 'url',
      },
      {
        field: 'consentDocumentUrl',
        label: 'Документ согласия',
        placeholder: 'https://school.example/consent',
        type: 'url',
      },
      {
        field: 'logoUrl',
        label: 'Логотип',
        placeholder: 'https://school.example/logo.svg',
        type: 'url',
        className: 'sm:col-span-2',
      },
    ],
  },
];

export function EducationOrganizationOperatorFields({
  idPrefix,
  values,
  onChange,
  disabled = false,
}: EducationOrganizationOperatorFieldsProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-admin-muted">
        * — обязательно для обработки ПДн от имени организации. Неполную организацию можно сохранить
        и заполнить позже.
      </p>

      {FIELD_GROUPS.map((group) => (
        <fieldset
          key={group.title}
          className="space-y-3 rounded-md border border-admin-border bg-admin-panel-muted/30 p-3"
        >
          <legend className="px-1 text-sm font-medium text-admin-foreground">{group.title}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.fields.map((fieldConfig) => {
              const inputId = `${idPrefix}-organization-${fieldConfig.field}`;
              const fieldLabel = fieldConfig.operatorRequired
                ? `${fieldConfig.label} *`
                : `${fieldConfig.label} — необязательно`;

              return (
                <div key={fieldConfig.field} className={`space-y-2 ${fieldConfig.className ?? ''}`}>
                  <Label htmlFor={inputId}>{fieldLabel}</Label>
                  <Input
                    id={inputId}
                    name={fieldConfig.field}
                    type={fieldConfig.type ?? 'text'}
                    autoComplete={fieldConfig.autoComplete ?? 'off'}
                    placeholder={fieldConfig.placeholder}
                    value={values[fieldConfig.field]}
                    onChange={(event) => onChange(fieldConfig.field, event.target.value)}
                    disabled={disabled}
                  />
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
```

## Full file snapshot

Path: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-create-card.tsx`

```tsx
import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import {
  EducationOrganizationOperatorFields,
  type EducationOrganizationOperatorField,
  type EducationOrganizationOperatorValues,
} from './education-organization-operator-fields';
import { EducationOrganizationValidationFields } from './education-organization-validation-fields';

import type { ValidationMode } from './education-organization-validation-fields';

export type { ValidationMode } from './education-organization-validation-fields';

interface EducationOrganizationsCreateCardProps {
  newOrganizationName: string;
  onNewOrganizationNameChange: (value: string) => void;
  newValidationMode: ValidationMode;
  onNewValidationModeChange: (value: ValidationMode) => void;
  newValidationPattern: string;
  onNewValidationPatternChange: (value: string) => void;
  newValidationExample: string;
  onNewValidationExampleChange: (value: string) => void;
  newValidationHint: string;
  onNewValidationHintChange: (value: string) => void;
  operatorValues: EducationOrganizationOperatorValues;
  onOperatorValueChange: (field: EducationOrganizationOperatorField, value: string) => void;
  isCreating: boolean;
  onCreate: () => void;
}

export function EducationOrganizationsCreateCard({
  newOrganizationName,
  onNewOrganizationNameChange,
  newValidationMode,
  onNewValidationModeChange,
  newValidationPattern,
  onNewValidationPatternChange,
  newValidationExample,
  onNewValidationExampleChange,
  newValidationHint,
  onNewValidationHintChange,
  operatorValues,
  onOperatorValueChange,
  isCreating,
  onCreate,
}: EducationOrganizationsCreateCardProps) {
  return (
    <Card className={adminClassNames.panel.card}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Добавить заведение</CardTitle>
            <CardDescription>
              Создайте новое заведение и сразу настройте формат группы/класса.
            </CardDescription>
          </div>
          <Badge variant="outline" className={adminBadgeClassNames.notice}>
            Новая запись
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="new-organization-name">Название *</Label>
          <Input
            id="new-organization-name"
            value={newOrganizationName}
            onChange={(event) => onNewOrganizationNameChange(event.target.value)}
            placeholder="Например: Лицей № 42"
            required
          />
        </div>

        <EducationOrganizationOperatorFields
          idPrefix="new"
          values={operatorValues}
          onChange={onOperatorValueChange}
        />

        <EducationOrganizationValidationFields
          idPrefix="new"
          validationMode={newValidationMode}
          onValidationModeChange={onNewValidationModeChange}
          validationPattern={newValidationPattern}
          onValidationPatternChange={onNewValidationPatternChange}
          validationExample={newValidationExample}
          onValidationExampleChange={onNewValidationExampleChange}
          validationHint={newValidationHint}
          onValidationHintChange={onNewValidationHintChange}
        />

        <Button type="button" className="w-full" onClick={onCreate} disabled={isCreating}>
          {isCreating ? 'Создаем...' : 'Добавить заведение'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

## Full file snapshot

Path: `client/src/widgets/admin-education-organizations-workspace/ui/education-organizations-edit-card.tsx`

```tsx
import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import {
  EducationOrganizationOperatorFields,
  type EducationOrganizationOperatorField,
  type EducationOrganizationOperatorValues,
} from './education-organization-operator-fields';
import {
  EducationOrganizationValidationFields,
  type ValidationMode,
} from './education-organization-validation-fields';

import type { AdminEducationOrganizationsListResponseDtoOrganizationsItem } from '@/shared/api/model';

interface EducationOrganizationsEditCardProps {
  selectedOrganization: AdminEducationOrganizationsListResponseDtoOrganizationsItem | null;
  editName: string;
  onEditNameChange: (value: string) => void;
  editIsActive: boolean;
  onEditIsActiveChange: (value: boolean) => void;
  editValidationMode: ValidationMode;
  onEditValidationModeChange: (value: ValidationMode) => void;
  editValidationPattern: string;
  onEditValidationPatternChange: (value: string) => void;
  editValidationExample: string;
  onEditValidationExampleChange: (value: string) => void;
  editValidationHint: string;
  onEditValidationHintChange: (value: string) => void;
  operatorValues: EducationOrganizationOperatorValues;
  onOperatorValueChange: (field: EducationOrganizationOperatorField, value: string) => void;
  isSaving: boolean;
  onSave: () => void;
}

function EducationOrganizationStatusBadges({
  organization,
}: {
  organization: AdminEducationOrganizationsListResponseDtoOrganizationsItem;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant="outline"
        className={
          organization.personalDataReady
            ? adminBadgeClassNames.success
            : adminBadgeClassNames.notice
        }
      >
        {organization.personalDataReady ? 'Данные ПДн готовы' : 'Данные ПДн не готовы'}
      </Badge>
      <Badge
        variant="outline"
        className={
          organization.isActive ? adminBadgeClassNames.success : adminBadgeClassNames.neutral
        }
      >
        {organization.isActive ? 'Активно' : 'Отключено'}
      </Badge>
    </div>
  );
}

export function EducationOrganizationsEditCard({
  selectedOrganization,
  editName,
  onEditNameChange,
  editIsActive,
  onEditIsActiveChange,
  editValidationMode,
  onEditValidationModeChange,
  editValidationPattern,
  onEditValidationPatternChange,
  editValidationExample,
  onEditValidationExampleChange,
  editValidationHint,
  onEditValidationHintChange,
  operatorValues,
  onOperatorValueChange,
  isSaving,
  onSave,
}: EducationOrganizationsEditCardProps) {
  return (
    <Card className={adminClassNames.panel.card}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Настройки выбранного заведения</CardTitle>
            <CardDescription>
              {selectedOrganization
                ? `Редактирование: ${selectedOrganization.name}`
                : 'Выберите заведение в таблице слева'}
            </CardDescription>
          </div>
          {selectedOrganization ? (
            <EducationOrganizationStatusBadges organization={selectedOrganization} />
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!selectedOrganization ? (
          <div className={adminClassNames.panel.empty}>
            Выберите строку в таблице, чтобы отредактировать заведение.
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="edit-organization-name">Название *</Label>
          <Input
            id="edit-organization-name"
            value={editName}
            onChange={(event) => onEditNameChange(event.target.value)}
            placeholder="Например: Лицей № 42"
            required
            disabled={!selectedOrganization}
          />
        </div>

        <label className={adminClassNames.form.checkboxLabel}>
          <input
            type="checkbox"
            checked={editIsActive}
            onChange={(event) => onEditIsActiveChange(event.target.checked)}
            disabled={!selectedOrganization}
          />
          Заведение активно
        </label>

        <EducationOrganizationOperatorFields
          idPrefix="edit"
          values={operatorValues}
          onChange={onOperatorValueChange}
          disabled={!selectedOrganization}
        />

        <EducationOrganizationValidationFields
          idPrefix="edit"
          validationMode={editValidationMode}
          onValidationModeChange={onEditValidationModeChange}
          validationPattern={editValidationPattern}
          onValidationPatternChange={onEditValidationPatternChange}
          validationExample={editValidationExample}
          onValidationExampleChange={onEditValidationExampleChange}
          validationHint={editValidationHint}
          onValidationHintChange={onEditValidationHintChange}
          disabled={!selectedOrganization}
        />

        {selectedOrganization ? (
          <div
            className={`text-xs ${adminClassNames.panel.compactSection} ${adminClassNames.text.body}`}
          >
            <p>{`Ссылки: ${selectedOrganization.activeLinksCount}/${selectedOrganization.linksCount}`}</p>
            <p>{`Попытки: ${selectedOrganization.attemptsCount}`}</p>
          </div>
        ) : null}

        <Button
          type="button"
          className="w-full"
          onClick={onSave}
          disabled={!selectedOrganization || isSaving}
        >
          {isSaving ? 'Сохраняем...' : 'Сохранить изменения'}
        </Button>
      </CardContent>
    </Card>
  );
}
```
