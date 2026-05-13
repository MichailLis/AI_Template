import {
  GROUP_VALIDATION_MODE_OPTIONS,
  parseGroupValidationMode,
  type GroupValidationMode,
} from '@/shared/lib/group-validation';
import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

export type ValidationMode = GroupValidationMode;

interface EducationOrganizationValidationFieldsProps {
  idPrefix: string;
  validationMode: ValidationMode;
  onValidationModeChange: (value: ValidationMode) => void;
  validationPattern: string;
  onValidationPatternChange: (value: string) => void;
  validationExample: string;
  onValidationExampleChange: (value: string) => void;
  validationHint: string;
  onValidationHintChange: (value: string) => void;
  disabled?: boolean;
}

export function EducationOrganizationValidationFields({
  idPrefix,
  validationMode,
  onValidationModeChange,
  validationPattern,
  onValidationPatternChange,
  validationExample,
  onValidationExampleChange,
  validationHint,
  onValidationHintChange,
  disabled = false,
}: EducationOrganizationValidationFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-organization-mode`}>Режим проверки группы/класса</Label>
        <select
          id={`${idPrefix}-organization-mode`}
          value={validationMode}
          onChange={(event) => onValidationModeChange(parseGroupValidationMode(event.target.value))}
          className={`flex ${adminClassNames.form.select}`}
          disabled={disabled}
        >
          {GROUP_VALIDATION_MODE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {validationMode !== 'NONE' ? (
        <>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-organization-pattern`}>Шаблон (RegExp)</Label>
            <Input
              id={`${idPrefix}-organization-pattern`}
              value={validationPattern}
              onChange={(event) => onValidationPatternChange(event.target.value)}
              placeholder="Например: ^[А-ЯA-Z]{2,4}-?\\d{1,3}[А-ЯA-Z]?$"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-organization-example`}>Пример</Label>
            <Input
              id={`${idPrefix}-organization-example`}
              value={validationExample}
              onChange={(event) => onValidationExampleChange(event.target.value)}
              placeholder="Например: ИС-21"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-organization-hint`}>Подсказка для студента</Label>
            <Input
              id={`${idPrefix}-organization-hint`}
              value={validationHint}
              onChange={(event) => onValidationHintChange(event.target.value)}
              placeholder="Например: Укажите формат ИС-21"
              disabled={disabled}
            />
          </div>
        </>
      ) : null}
    </>
  );
}
