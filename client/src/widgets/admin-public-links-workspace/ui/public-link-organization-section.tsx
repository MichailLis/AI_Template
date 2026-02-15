import {
  GROUP_VALIDATION_MODE_OPTIONS,
  parseGroupValidationMode,
} from '@/shared/lib/group-validation';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import type { PublicLinkOrganizationSectionProps } from './public-link-create-card.types';

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
  const activeEducationOrganizations = educationOrganizations.filter(
    (organization) => organization.isActive,
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="education-organization">Учебное заведение (опционально)</Label>
      <select
        id="education-organization"
        value={newEducationOrganizationId ? String(newEducationOrganizationId) : ''}
        onChange={(event) => {
          const value = event.target.value;
          onEducationOrganizationSelect(value ? Number.parseInt(value, 10) : null);
        }}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="">Не привязывать (студент заполнит сам)</option>
        {activeEducationOrganizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
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
        >
          {isCreatingEducationOrganization ? 'Добавляем...' : 'Добавить'}
        </Button>
      </div>

      <div className="space-y-2 rounded-md border border-slate-200 p-3">
        <Label htmlFor="group-validation-mode">Проверка поля «Группа / класс»</Label>
        <select
          id="group-validation-mode"
          value={groupValidationMode}
          onChange={(event) =>
            onGroupValidationModeChange(parseGroupValidationMode(event.target.value))
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
    </div>
  );
}
