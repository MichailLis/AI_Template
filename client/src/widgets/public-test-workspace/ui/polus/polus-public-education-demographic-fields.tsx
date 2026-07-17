import {
  studentEducationLevelOptions,
  studentGenderOptions,
} from '../public-test-demographic-options';

import { PolusSelectField } from './polus-public-select-field';

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

interface PolusDemographicSelectFieldsProps {
  demographicFormState: DemographicFormState;
  onDemographicFieldChange: DemographicFieldChangeHandler;
}

function PolusDemographicSelectFields({
  demographicFormState,
  onDemographicFieldChange,
}: PolusDemographicSelectFieldsProps) {
  return (
    <>
      <div className="polus-field">
        <label htmlFor="polus-student-gender">Пол</label>
        <PolusSelectField
          id="polus-student-gender"
          options={studentGenderOptions}
          placeholder="Выберите пол"
          required
          value={demographicFormState.gender}
          onChange={(value) =>
            onDemographicFieldChange('gender', value as DemographicFormState['gender'])
          }
        />
      </div>
      <div className="polus-field">
        <label htmlFor="polus-student-education-level">Уровень образования</label>
        <PolusSelectField
          id="polus-student-education-level"
          options={studentEducationLevelOptions}
          placement="top"
          placeholder="Выберите уровень"
          required
          value={demographicFormState.educationLevel}
          onChange={(value) =>
            onDemographicFieldChange(
              'educationLevel',
              value as DemographicFormState['educationLevel'],
            )
          }
        />
      </div>
    </>
  );
}

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
        <label htmlFor="polus-student-name">Имя</label>
        <input
          id="polus-student-name"
          value={registrationFormState.studentName}
          onChange={(event) => onEducationFieldChange('studentName', event.target.value)}
          placeholder="Введите ваше имя"
          required
        />
      </div>
      <div className="polus-field">
        <label htmlFor="polus-student-last-initial">Фамилия (1-я буква)</label>
        <input
          id="polus-student-last-initial"
          className="polus-initial-input"
          value={registrationFormState.studentLastInitial}
          onChange={(event) =>
            onEducationFieldChange('studentLastInitial', event.target.value.toUpperCase())
          }
          placeholder="И"
          required
        />
      </div>
      <div className="polus-field">
        <label htmlFor="polus-student-middle-initial">Отчество (1-я буква)</label>
        <input
          id="polus-student-middle-initial"
          className="polus-initial-input"
          value={registrationFormState.studentMiddleInitial}
          onChange={(event) =>
            onEducationFieldChange('studentMiddleInitial', event.target.value.toUpperCase())
          }
          placeholder="О"
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
          placeholder="Например, 17"
          required
        />
      </div>
      <div className="polus-field">
        <label htmlFor="polus-student-group">Класс / группа</label>
        <input
          id="polus-student-group"
          value={registrationFormState.groupOrClass}
          onChange={(event) => onEducationFieldChange('groupOrClass', event.target.value)}
          placeholder={link.groupValidationExample || '10А, ИС-21...'}
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
          placeholder={
            link.educationOrganization
              ? 'Учебное заведение определено по ссылке'
              : 'Школа, колледж, вуз...'
          }
          required
        />
      </div>
      <PolusDemographicSelectFields
        demographicFormState={demographicFormState}
        onDemographicFieldChange={onDemographicFieldChange}
      />
      <div className="polus-field polus-field-wide">
        <label htmlFor="polus-student-residence">Место жительства</label>
        <span className="polus-field-hint" id="polus-student-residence-hint">
          Область, город или населенный пункт
        </span>
        <input
          id="polus-student-residence"
          value={demographicFormState.residence}
          aria-describedby="polus-student-residence-hint"
          onChange={(event) => onDemographicFieldChange('residence', event.target.value)}
          placeholder="Город или населенный пункт"
          required
        />
      </div>
    </>
  );
}
