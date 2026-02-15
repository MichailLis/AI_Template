import {
  GROUP_VALIDATION_MODE_OPTIONS,
  parseGroupValidationMode,
  type GroupValidationMode,
} from '@/shared/lib/group-validation';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

export type ValidationMode = GroupValidationMode;

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
    <Card className="border-slate-200">
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

        <div className="space-y-2">
          <Label htmlFor="new-organization-mode">Режим проверки группы/класса</Label>
          <select
            id="new-organization-mode"
            value={newValidationMode}
            onChange={(event) =>
              onNewValidationModeChange(parseGroupValidationMode(event.target.value))
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {GROUP_VALIDATION_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {newValidationMode !== 'NONE' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="new-organization-pattern">Шаблон (RegExp)</Label>
              <Input
                id="new-organization-pattern"
                value={newValidationPattern}
                onChange={(event) => onNewValidationPatternChange(event.target.value)}
                placeholder="Например: ^[А-ЯA-Z]{2,4}-?\\d{1,3}[А-ЯA-Z]?$"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-organization-example">Пример</Label>
              <Input
                id="new-organization-example"
                value={newValidationExample}
                onChange={(event) => onNewValidationExampleChange(event.target.value)}
                placeholder="Например: ИС-21"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-organization-hint">Подсказка для студента</Label>
              <Input
                id="new-organization-hint"
                value={newValidationHint}
                onChange={(event) => onNewValidationHintChange(event.target.value)}
                placeholder="Например: Укажите формат ИС-21"
              />
            </div>
          </>
        ) : null}

        <Button type="button" className="w-full" onClick={onCreate} disabled={isCreating}>
          {isCreating ? 'Создаем...' : 'Добавить заведение'}
        </Button>
      </CardContent>
    </Card>
  );
}
