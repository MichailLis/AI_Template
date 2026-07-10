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
