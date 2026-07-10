import {
  GROUP_VALIDATION_MODE_OPTIONS,
  parseGroupValidationMode,
} from '@/shared/lib/group-validation';
import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminSelectField } from '@/shared/ui/admin-select-field';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import type {
  EducationOrganizationOption,
  PersonalDataProcessingMode,
  PublicLinkOrganizationSectionProps,
} from './public-link-create-card.types';
import type { GroupValidationMode } from '@/shared/lib/group-validation';

interface EducationOrganizationSelectProps {
  educationOrganizations: EducationOrganizationOption[];
  newEducationOrganizationId: number | null;
  onEducationOrganizationSelect: (organizationId: number | null) => void;
}

interface EducationOrganizationCreateRowProps {
  newEducationOrganizationName: string;
  onEducationOrganizationNameChange: (value: string) => void;
  onCreateEducationOrganization: () => void;
  isCreatingEducationOrganization: boolean;
}

interface GroupValidationDetailsProps {
  newEducationOrganizationId: number | null;
  groupValidationMode: GroupValidationMode;
  onGroupValidationModeChange: (value: GroupValidationMode) => void;
  groupValidationPattern: string;
  onGroupValidationPatternChange: (value: string) => void;
  groupValidationExample: string;
  onGroupValidationExampleChange: (value: string) => void;
  groupValidationHint: string;
  onGroupValidationHintChange: (value: string) => void;
  onUpdateEducationOrganization: () => void;
  isUpdatingEducationOrganization: boolean;
}

interface PersonalDataProcessingModeFieldProps {
  value: PersonalDataProcessingMode;
  onChange: (value: PersonalDataProcessingMode) => void;
}

function PersonalDataProcessingModeField({
  value,
  onChange,
}: PersonalDataProcessingModeFieldProps) {
  return (
    <fieldset className="space-y-2 rounded-md border border-admin-border bg-admin-panel p-3">
      <legend className={`px-1 text-sm font-medium ${adminClassNames.text.heading}`}>
        Оператор персональных данных
      </legend>
      <label className={adminClassNames.form.checkboxLabel}>
        <input
          type="radio"
          name="personal-data-processing-mode"
          value="PUBLIC"
          checked={value === 'PUBLIC'}
          onChange={() => onChange('PUBLIC')}
        />
        Оператор — платформа
      </label>
      <label className={adminClassNames.form.checkboxLabel}>
        <input
          type="radio"
          name="personal-data-processing-mode"
          value="ON_BEHALF_OF_EDUCATION_ORGANIZATION"
          checked={value === 'ON_BEHALF_OF_EDUCATION_ORGANIZATION'}
          onChange={() => onChange('ON_BEHALF_OF_EDUCATION_ORGANIZATION')}
        />
        От имени учебного заведения
      </label>
      <p className={adminClassNames.form.fieldHint}>
        Оператор и ссылки на документы фиксируются при сохранении публичной ссылки.
      </p>
    </fieldset>
  );
}

function EducationOrganizationSelect({
  educationOrganizations,
  newEducationOrganizationId,
  onEducationOrganizationSelect,
}: EducationOrganizationSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="education-organization">Заведение для ссылки</Label>
      <AdminSelectField
        id="education-organization"
        value={newEducationOrganizationId ? String(newEducationOrganizationId) : ''}
        onChange={(event) => {
          const value = event.target.value;
          onEducationOrganizationSelect(value ? Number.parseInt(value, 10) : null);
        }}
        className="flex"
      >
        <option value="">Не привязывать (студент заполнит сам)</option>
        {educationOrganizations.map((organization) => (
          <option key={organization.id} value={organization.id} disabled={!organization.isActive}>
            {`${organization.name} — ${organization.personalDataReady ? 'ПДн готовы' : 'ПДн не готовы'}${organization.isActive ? '' : ' (отключено)'}`}
          </option>
        ))}
      </AdminSelectField>
    </div>
  );
}

function EducationOrganizationCreateRow({
  newEducationOrganizationName,
  onEducationOrganizationNameChange,
  onCreateEducationOrganization,
  isCreatingEducationOrganization,
}: EducationOrganizationCreateRowProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        aria-label="Название нового учебного заведения"
        value={newEducationOrganizationName}
        onChange={(event) => onEducationOrganizationNameChange(event.target.value)}
        placeholder="Добавить новое заведение"
      />
      <Button
        type="button"
        variant="outline"
        onClick={onCreateEducationOrganization}
        disabled={isCreatingEducationOrganization}
        className="sm:w-32"
      >
        {isCreatingEducationOrganization ? 'Добавляем...' : 'Добавить'}
      </Button>
      <p className={`text-xs sm:basis-full ${adminClassNames.text.muted}`}>
        После быстрого добавления заполните реквизиты в разделе «Учебные заведения», прежде чем
        выбрать организацию оператором ПДн.
      </p>
    </div>
  );
}

function GroupValidationDetails({
  newEducationOrganizationId,
  groupValidationMode,
  onGroupValidationModeChange,
  groupValidationPattern,
  onGroupValidationPatternChange,
  groupValidationExample,
  onGroupValidationExampleChange,
  groupValidationHint,
  onGroupValidationHintChange,
  onUpdateEducationOrganization,
  isUpdatingEducationOrganization,
}: GroupValidationDetailsProps) {
  return (
    <details className={`mt-3 ${adminClassNames.panel.compactCard}`}>
      <summary className={`cursor-pointer text-sm font-medium ${adminClassNames.text.heading}`}>
        Настройки поля «Группа / класс»
      </summary>
      <div className="mt-3 flex flex-col gap-2">
        <p className={adminClassNames.form.fieldHint}>
          Эти правила применяются к выбранному заведению и помогают привести ответы к одному
          формату.
        </p>
        <Label htmlFor="group-validation-mode">Проверка поля</Label>
        <AdminSelectField
          id="group-validation-mode"
          value={groupValidationMode}
          onChange={(event) =>
            onGroupValidationModeChange(parseGroupValidationMode(event.target.value))
          }
          className="flex"
        >
          {GROUP_VALIDATION_MODE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </AdminSelectField>

        {groupValidationMode !== 'NONE' ? (
          <>
            <div className="flex flex-col gap-1">
              <Label htmlFor="group-validation-pattern">Шаблон (RegExp)</Label>
              <Input
                id="group-validation-pattern"
                value={groupValidationPattern}
                onChange={(event) => onGroupValidationPatternChange(event.target.value)}
                placeholder="Например: ^[А-ЯA-Z]{2,4}-?\\d{1,3}[А-ЯA-Z]?$"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="group-validation-example">Пример</Label>
              <Input
                id="group-validation-example"
                value={groupValidationExample}
                onChange={(event) => onGroupValidationExampleChange(event.target.value)}
                placeholder="Например: ИС-21"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="group-validation-hint">Подсказка/ошибка</Label>
              <Input
                id="group-validation-hint"
                value={groupValidationHint}
                onChange={(event) => onGroupValidationHintChange(event.target.value)}
                placeholder="Например: Укажите формат ИС-21"
              />
            </div>
          </>
        ) : null}

        <Button
          type="button"
          variant="outline"
          onClick={onUpdateEducationOrganization}
          disabled={!newEducationOrganizationId || isUpdatingEducationOrganization}
          className="w-full"
        >
          {isUpdatingEducationOrganization ? 'Сохраняем...' : 'Сохранить настройки заведения'}
        </Button>
      </div>
    </details>
  );
}

export function PublicLinkOrganizationSection({
  educationOrganizations,
  newEducationOrganizationId,
  onEducationOrganizationSelect,
  newPersonalDataProcessingMode,
  onPersonalDataProcessingModeChange,
  newEducationOrganizationName,
  onEducationOrganizationNameChange,
  groupValidationMode,
  onGroupValidationModeChange,
  groupValidationPattern,
  onGroupValidationPatternChange,
  groupValidationExample,
  onGroupValidationExampleChange,
  groupValidationHint,
  onGroupValidationHintChange,
  onCreateEducationOrganization,
  onUpdateEducationOrganization,
  isCreatingEducationOrganization,
  isUpdatingEducationOrganization,
}: PublicLinkOrganizationSectionProps) {
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
        <PersonalDataProcessingModeField
          value={newPersonalDataProcessingMode}
          onChange={onPersonalDataProcessingModeChange}
        />
        <EducationOrganizationSelect
          educationOrganizations={educationOrganizations}
          newEducationOrganizationId={newEducationOrganizationId}
          onEducationOrganizationSelect={onEducationOrganizationSelect}
        />
        {newPersonalDataProcessingMode === 'PUBLIC' ? (
          <p className={adminClassNames.form.fieldHint}>
            Выбор заведения для анкеты не меняет оператора персональных данных: оператором остается
            платформа.
          </p>
        ) : null}
        <EducationOrganizationCreateRow
          newEducationOrganizationName={newEducationOrganizationName}
          onEducationOrganizationNameChange={onEducationOrganizationNameChange}
          onCreateEducationOrganization={onCreateEducationOrganization}
          isCreatingEducationOrganization={isCreatingEducationOrganization}
        />
      </div>

      <GroupValidationDetails
        newEducationOrganizationId={newEducationOrganizationId}
        groupValidationMode={groupValidationMode}
        onGroupValidationModeChange={onGroupValidationModeChange}
        groupValidationPattern={groupValidationPattern}
        onGroupValidationPatternChange={onGroupValidationPatternChange}
        groupValidationExample={groupValidationExample}
        onGroupValidationExampleChange={onGroupValidationExampleChange}
        groupValidationHint={groupValidationHint}
        onGroupValidationHintChange={onGroupValidationHintChange}
        onUpdateEducationOrganization={onUpdateEducationOrganization}
        isUpdatingEducationOrganization={isUpdatingEducationOrganization}
      />
    </div>
  );
}
