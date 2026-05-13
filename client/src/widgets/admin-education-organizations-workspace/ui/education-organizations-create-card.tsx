import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

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
  isCreating,
  onCreate,
}: EducationOrganizationsCreateCardProps) {
  return (
    <Card className={adminClassNames.panel.card}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Добавить заведение</CardTitle>
        <CardDescription>
          Создайте новое заведение и сразу настройте формат группы/класса.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="new-organization-name">Название</Label>
          <Input
            id="new-organization-name"
            value={newOrganizationName}
            onChange={(event) => onNewOrganizationNameChange(event.target.value)}
            placeholder="Например: Колледж №1"
          />
        </div>

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
