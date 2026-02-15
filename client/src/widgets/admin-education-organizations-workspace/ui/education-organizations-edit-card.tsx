import {
  GROUP_VALIDATION_MODE_OPTIONS,
  parseGroupValidationMode,
} from '@/shared/lib/group-validation';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import type { ValidationMode } from './education-organizations-create-card';
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
  isSaving: boolean;
  onSave: () => void;
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
  isSaving,
  onSave,
}: EducationOrganizationsEditCardProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Настройки выбранного заведения</CardTitle>
        <CardDescription>
          {selectedOrganization
            ? `Редактирование: ${selectedOrganization.name}`
            : 'Выберите заведение в таблице слева'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="edit-organization-name">Название</Label>
          <Input
            id="edit-organization-name"
            value={editName}
            onChange={(event) => onEditNameChange(event.target.value)}
            placeholder="Название учебного заведения"
            disabled={!selectedOrganization}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={editIsActive}
            onChange={(event) => onEditIsActiveChange(event.target.checked)}
            disabled={!selectedOrganization}
          />
          Заведение активно
        </label>

        <div className="space-y-2">
          <Label htmlFor="edit-organization-mode">Режим проверки группы/класса</Label>
          <select
            id="edit-organization-mode"
            value={editValidationMode}
            onChange={(event) =>
              onEditValidationModeChange(parseGroupValidationMode(event.target.value))
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={!selectedOrganization}
          >
            {GROUP_VALIDATION_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {editValidationMode !== 'NONE' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="edit-organization-pattern">Шаблон (RegExp)</Label>
              <Input
                id="edit-organization-pattern"
                value={editValidationPattern}
                onChange={(event) => onEditValidationPatternChange(event.target.value)}
                placeholder="Например: ^[А-ЯA-Z]{2,4}-?\\d{1,3}[А-ЯA-Z]?$"
                disabled={!selectedOrganization}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-organization-example">Пример</Label>
              <Input
                id="edit-organization-example"
                value={editValidationExample}
                onChange={(event) => onEditValidationExampleChange(event.target.value)}
                placeholder="Например: ИС-21"
                disabled={!selectedOrganization}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-organization-hint">Подсказка для студента</Label>
              <Input
                id="edit-organization-hint"
                value={editValidationHint}
                onChange={(event) => onEditValidationHintChange(event.target.value)}
                placeholder="Например: Укажите формат ИС-21"
                disabled={!selectedOrganization}
              />
            </div>
          </>
        ) : null}

        {selectedOrganization ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
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
