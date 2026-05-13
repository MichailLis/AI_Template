import {
  GROUP_VALIDATION_MODE_OPTIONS,
  parseGroupValidationMode,
} from '@/shared/lib/group-validation';
import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import type {
  EducationOrganizationOption,
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

function EducationOrganizationSelect({
  educationOrganizations,
  newEducationOrganizationId,
  onEducationOrganizationSelect,
}: EducationOrganizationSelectProps) {
  const activeEducationOrganizations = educationOrganizations.filter(
    (organization) => organization.isActive,
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="education-organization">Заведение для ссылки</Label>
      <select
        id="education-organization"
        value={newEducationOrganizationId ? String(newEducationOrganizationId) : ''}
        onChange={(event) => {
          const value = event.target.value;
          onEducationOrganizationSelect(value ? Number.parseInt(value, 10) : null);
        }}
        className={`flex ${adminClassNames.form.select}`}
      >
        <option value="">Не привязывать (студент заполнит сам)</option>
        {activeEducationOrganizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name}
          </option>
        ))}
      </select>
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
      <div className="mt-3 space-y-2">
        <p className={adminClassNames.form.fieldHint}>
          Эти правила применяются к выбранному заведению и помогают привести ответы к одному
          формату.
        </p>
        <Label htmlFor="group-validation-mode">Проверка поля</Label>
        <select
          id="group-validation-mode"
          value={groupValidationMode}
          onChange={(event) =>
            onGroupValidationModeChange(parseGroupValidationMode(event.target.value))
          }
          className={`flex ${adminClassNames.form.select}`}
        >
          {GROUP_VALIDATION_MODE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {groupValidationMode !== 'NONE' ? (
          <>
            <div className="space-y-1">
              <Label htmlFor="group-validation-pattern">Шаблон (RegExp)</Label>
              <Input
                id="group-validation-pattern"
                value={groupValidationPattern}
                onChange={(event) => onGroupValidationPatternChange(event.target.value)}
                placeholder="Например: ^[А-ЯA-Z]{2,4}-?\\d{1,3}[А-ЯA-Z]?$"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="group-validation-example">Пример</Label>
              <Input
                id="group-validation-example"
                value={groupValidationExample}
                onChange={(event) => onGroupValidationExampleChange(event.target.value)}
                placeholder="Например: ИС-21"
              />
            </div>
            <div className="space-y-1">
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
      <p className={`text-sm font-medium ${adminClassNames.text.heading}`}>Учебное заведение</p>
      <p className={`mt-1 text-sm ${adminClassNames.text.body}`}>
        Привяжите ссылку к заведению, если студентам не нужно вводить его вручную.
      </p>

      <div className="mt-3 space-y-3">
        <EducationOrganizationSelect
          educationOrganizations={educationOrganizations}
          newEducationOrganizationId={newEducationOrganizationId}
          onEducationOrganizationSelect={onEducationOrganizationSelect}
        />
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
