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
