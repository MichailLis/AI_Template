import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

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
    <Card className={adminClassNames.panel.card}>
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

        <label className={adminClassNames.form.checkboxLabel}>
          <input
            type="checkbox"
            checked={editIsActive}
            onChange={(event) => onEditIsActiveChange(event.target.checked)}
            disabled={!selectedOrganization}
          />
          Заведение активно
        </label>

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
