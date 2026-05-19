import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import type { DemographicFormState } from './public-test-entry.types';

type DemographicFieldChangeHandler = <K extends keyof DemographicFormState>(
  key: K,
  value: DemographicFormState[K],
) => void;

interface RegistrationDemographicFieldsProps {
  formState: DemographicFormState;
  onFieldChange: DemographicFieldChangeHandler;
}

const educationLevelOptions = [
  { value: 'BASIC_GENERAL', label: 'Основное общее' },
  { value: 'SECONDARY_GENERAL', label: 'Среднее общее' },
  { value: 'SECONDARY_SPECIAL', label: 'Среднее специальное' },
  { value: 'INCOMPLETE_HIGHER_FROM_YEAR_3', label: 'Неоконченное высшее (начиная с 3 курса)' },
  { value: 'HIGHER', label: 'Высшее' },
] as const;

export function RegistrationDemographicFields({
  formState,
  onFieldChange,
}: RegistrationDemographicFieldsProps) {
  return (
    <>
      <div className="space-y-2 md:col-span-2">
        <p className="text-sm font-semibold text-foreground">Дополнительная анкета</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="hybrid-student-gender" className="font-medium">
          Пол
        </Label>
        <select
          id="hybrid-student-gender"
          value={formState.gender}
          onChange={(event) =>
            onFieldChange('gender', event.target.value as DemographicFormState['gender'])
          }
          required
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Выберите пол</option>
          <option value="MALE">Мужской</option>
          <option value="FEMALE">Женский</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="hybrid-student-age" className="font-medium">
          Возраст
        </Label>
        <Input
          id="hybrid-student-age"
          type="number"
          min={1}
          max={120}
          value={formState.age}
          onChange={(event) => onFieldChange('age', event.target.value)}
          required
          className="h-11"
          placeholder="Например, 17"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="hybrid-student-residence" className="font-medium">
          Место жительства
        </Label>
        <Input
          id="hybrid-student-residence"
          value={formState.residence}
          onChange={(event) => onFieldChange('residence', event.target.value)}
          required
          className="h-11"
          placeholder="Город или населенный пункт"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="hybrid-student-education-level" className="font-medium">
          Уровень образования
        </Label>
        <select
          id="hybrid-student-education-level"
          value={formState.educationLevel}
          onChange={(event) =>
            onFieldChange(
              'educationLevel',
              event.target.value as DemographicFormState['educationLevel'],
            )
          }
          required
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Выберите уровень образования</option>
          {educationLevelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
