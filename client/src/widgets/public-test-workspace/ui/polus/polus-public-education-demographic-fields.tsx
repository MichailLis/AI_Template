import type { DemographicFormState, StudentFormState } from '../public-test-entry.types';
import type { PublicLinkAccessResponseDto } from '@/shared/api/model';

type EducationFieldChangeHandler = <K extends keyof StudentFormState>(
  key: K,
  value: StudentFormState[K],
) => void;

type DemographicFieldChangeHandler = <K extends keyof DemographicFormState>(
  key: K,
  value: DemographicFormState[K],
) => void;

interface PolusEducationDemographicFieldsProps {
  demographicFormState: DemographicFormState;
  registrationFormState: StudentFormState;
  link: PublicLinkAccessResponseDto;
  warning: string | null;
  onEducationFieldChange: EducationFieldChangeHandler;
  onDemographicFieldChange: DemographicFieldChangeHandler;
}

const educationLevelOptions = [
  { value: 'BASIC_GENERAL', label: 'Основное общее' },
  { value: 'SECONDARY_GENERAL', label: 'Среднее общее' },
  { value: 'SECONDARY_SPECIAL', label: 'Среднее специальное' },
  { value: 'INCOMPLETE_HIGHER_FROM_YEAR_3', label: 'Неоконченное высшее (начиная с 3 курса)' },
  { value: 'HIGHER', label: 'Высшее' },
] as const;

export function PolusEducationDemographicFields({
  demographicFormState,
  registrationFormState,
  link,
  warning,
  onEducationFieldChange,
  onDemographicFieldChange,
}: PolusEducationDemographicFieldsProps) {
  return (
    <>
      <div className="polus-field polus-field-wide">
        <label htmlFor="polus-student-name">Имя участника</label>
        <input
          id="polus-student-name"
          value={registrationFormState.studentName}
          onChange={(event) => onEducationFieldChange('studentName', event.target.value)}
          required
        />
      </div>
      <div className="polus-field">
        <label htmlFor="polus-student-age">Возраст</label>
        <input
          id="polus-student-age"
          type="number"
          min={1}
          max={120}
          value={demographicFormState.age}
          onChange={(event) => onDemographicFieldChange('age', event.target.value)}
          required
        />
      </div>
      <div className="polus-field">
        <label htmlFor="polus-student-group">Класс / группа</label>
        <input
          id="polus-student-group"
          value={registrationFormState.groupOrClass}
          onChange={(event) => onEducationFieldChange('groupOrClass', event.target.value)}
          placeholder={link.groupValidationExample || '10А, ИС-21'}
          required
        />
        {warning ? <p className="text-sm text-red-600">{warning}</p> : null}
      </div>
      <div className="polus-field polus-field-wide">
        <label htmlFor="polus-student-place">Учебное заведение</label>
        <input
          id="polus-student-place"
          value={registrationFormState.educationOrganization}
          onChange={(event) => onEducationFieldChange('educationOrganization', event.target.value)}
          disabled={Boolean(link.educationOrganization)}
          required
        />
      </div>
      <p className="polus-form-section-title">Дополнительная анкета</p>
      <div className="polus-field">
        <label htmlFor="polus-student-gender">1. Укажите, пожалуйста Ваш пол?</label>
        <select
          id="polus-student-gender"
          value={demographicFormState.gender}
          onChange={(event) =>
            onDemographicFieldChange('gender', event.target.value as DemographicFormState['gender'])
          }
          required
        >
          <option value="">Выберите пол</option>
          <option value="MALE">Мужской</option>
          <option value="FEMALE">Женский</option>
        </select>
      </div>
      <div className="polus-field polus-field-wide">
        <label htmlFor="polus-student-residence">3. Укажите Ваше место жительства?</label>
        <input
          id="polus-student-residence"
          value={demographicFormState.residence}
          onChange={(event) => onDemographicFieldChange('residence', event.target.value)}
          required
        />
      </div>
      <div className="polus-field polus-field-wide">
        <label htmlFor="polus-student-education-level">
          4. Укажите уровень Вашего образования:
        </label>
        <select
          id="polus-student-education-level"
          value={demographicFormState.educationLevel}
          onChange={(event) =>
            onDemographicFieldChange(
              'educationLevel',
              event.target.value as DemographicFormState['educationLevel'],
            )
          }
          required
        >
          <option value="">Выберите уровень</option>
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
