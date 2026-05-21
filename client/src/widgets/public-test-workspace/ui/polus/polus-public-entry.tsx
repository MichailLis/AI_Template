import { polusAssets } from '@/features/tests';

import { PolusEducationDemographicFields } from './polus-public-education-demographic-fields';
import { PolusPublicLayout } from './polus-public-layout';
import { PolusSelectField } from './polus-public-select-field';

import type {
  DemographicFormState,
  EntryProfileMode,
  StudentFormState,
} from '../public-test-entry.types';
import type { PublicLinkAccessResponseDto } from '@/shared/api/model';
import type { FormEvent } from 'react';

type EducationFieldChangeHandler = <K extends keyof StudentFormState>(
  key: K,
  value: StudentFormState[K],
) => void;

type DemographicFieldChangeHandler = <K extends keyof DemographicFormState>(
  key: K,
  value: DemographicFormState[K],
) => void;

interface PolusPublicEntryProps {
  link: PublicLinkAccessResponseDto;
  entryProfileMode: EntryProfileMode;
  demographicFormState: DemographicFormState;
  registrationFormState: StudentFormState;
  currentGroupValidationWarning: string | null;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
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

const genderOptions = [
  { value: 'MALE', label: 'Мужской' },
  { value: 'FEMALE', label: 'Женский' },
] as const;

function PolusIntroPanel() {
  return (
    <section className="polus-intro-panel" aria-labelledby="polus-page-title">
      <div>
        <h1 id="polus-page-title">Найди свой инженерный маршрут</h1>
        <p className="polus-lead">
          Пройдите короткий тест и узнайте, какие технические задачи вам ближе: 3D-моделирование,
          печать изделий, доработка деталей, конструирование, программирование или беспилотные
          системы.
        </p>
      </div>

      <div className="polus-metrics" aria-label="Результат теста">
        <div className="polus-metric-row polus-metric-row--outcome">
          <span>
            По итогам вы получите подходящие направления, профессии и первые практические шаги.
          </span>
        </div>
      </div>

      <div className="polus-professor" aria-label="Сопровождение теста">
        <div className="polus-professor-card">
          <p>
            Профессор Полюс придумал этот тест, чтобы помочь вам примерить инженерные направления на
            свои интересы.
          </p>
        </div>
        <img className="polus-professor-figure" src={polusAssets.professor} alt="Профессор Полюс" />
      </div>
    </section>
  );
}

function EducationProfileFields({
  formState,
  link,
  warning,
  onFieldChange,
}: {
  formState: StudentFormState;
  link: PublicLinkAccessResponseDto;
  warning: string | null;
  onFieldChange: EducationFieldChangeHandler;
}) {
  return (
    <>
      <div className="polus-field polus-field-wide">
        <label htmlFor="polus-student-name">Имя</label>
        <input
          id="polus-student-name"
          value={formState.studentName}
          onChange={(event) => onFieldChange('studentName', event.target.value)}
          placeholder="Введите ваше имя"
          required
        />
      </div>
      <div className="polus-field">
        <label htmlFor="polus-student-last-initial">Фамилия (1-я буква)</label>
        <input
          id="polus-student-last-initial"
          className="polus-initial-input"
          value={formState.studentLastInitial}
          onChange={(event) =>
            onFieldChange('studentLastInitial', event.target.value.toUpperCase())
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
          value={formState.studentMiddleInitial}
          onChange={(event) =>
            onFieldChange('studentMiddleInitial', event.target.value.toUpperCase())
          }
          placeholder="О"
          required
        />
      </div>
      <div className="polus-field polus-field-wide">
        <label htmlFor="polus-student-place">Учебное заведение</label>
        <input
          id="polus-student-place"
          value={formState.educationOrganization}
          onChange={(event) => onFieldChange('educationOrganization', event.target.value)}
          disabled={Boolean(link.educationOrganization)}
          placeholder={
            link.educationOrganization
              ? 'Учебное заведение определено по ссылке'
              : 'Школа, колледж, вуз...'
          }
          required
        />
      </div>
      <div className="polus-field polus-field-wide">
        <label htmlFor="polus-student-group">Класс / группа</label>
        <input
          id="polus-student-group"
          value={formState.groupOrClass}
          onChange={(event) => onFieldChange('groupOrClass', event.target.value)}
          placeholder={link.groupValidationExample || '10А, ИС-21...'}
          required
        />
        {warning ? <p className="text-sm text-red-600">{warning}</p> : null}
      </div>
    </>
  );
}

function DemographicProfileFields({
  formState,
  onFieldChange,
  showAge = true,
}: {
  formState: DemographicFormState;
  onFieldChange: DemographicFieldChangeHandler;
  showAge?: boolean;
}) {
  return (
    <>
      <p className="polus-form-section-title">Демографическая анкета</p>
      <div className="polus-field">
        <label htmlFor="polus-student-gender">1. Укажите, пожалуйста Ваш пол?</label>
        <PolusSelectField
          id="polus-student-gender"
          options={genderOptions}
          placeholder="Выберите пол"
          required
          value={formState.gender}
          onChange={(value) => onFieldChange('gender', value as DemographicFormState['gender'])}
        />
      </div>
      {showAge ? (
        <div className="polus-field">
          <label htmlFor="polus-student-age">Возраст</label>
          <input
            id="polus-student-age"
            type="number"
            min={1}
            max={120}
            value={formState.age}
            onChange={(event) => onFieldChange('age', event.target.value)}
            placeholder="Например, 17"
            required
          />
        </div>
      ) : null}
      <div className="polus-field polus-field-wide">
        <label htmlFor="polus-student-residence">Место жительства</label>
        <span className="polus-field-hint" id="polus-student-residence-hint">
          Область, город или населенный пункт
        </span>
        <input
          id="polus-student-residence"
          value={formState.residence}
          aria-describedby="polus-student-residence-hint"
          onChange={(event) => onFieldChange('residence', event.target.value)}
          placeholder="Город или населенный пункт"
          required
        />
      </div>
      <div className="polus-field polus-field-wide">
        <label htmlFor="polus-student-education-level">
          4. Укажите уровень Вашего образования:
        </label>
        <PolusSelectField
          id="polus-student-education-level"
          options={educationLevelOptions}
          placeholder="Выберите уровень"
          placement="top"
          required
          value={formState.educationLevel}
          onChange={(value) =>
            onFieldChange('educationLevel', value as DemographicFormState['educationLevel'])
          }
        />
      </div>
    </>
  );
}

export function PolusPublicEntry({
  link,
  entryProfileMode,
  demographicFormState,
  registrationFormState,
  currentGroupValidationWarning,
  isSubmitting,
  onSubmit,
  onEducationFieldChange,
  onDemographicFieldChange,
}: PolusPublicEntryProps) {
  let profileFields;

  if (entryProfileMode === 'EDUCATION_DEMOGRAPHIC') {
    profileFields = (
      <PolusEducationDemographicFields
        demographicFormState={demographicFormState}
        registrationFormState={registrationFormState}
        link={link}
        warning={currentGroupValidationWarning}
        onEducationFieldChange={onEducationFieldChange}
        onDemographicFieldChange={onDemographicFieldChange}
      />
    );
  } else if (entryProfileMode === 'EDUCATION') {
    profileFields = (
      <EducationProfileFields
        formState={registrationFormState}
        link={link}
        warning={currentGroupValidationWarning}
        onFieldChange={onEducationFieldChange}
      />
    );
  } else {
    profileFields = (
      <DemographicProfileFields
        formState={demographicFormState}
        onFieldChange={onDemographicFieldChange}
      />
    );
  }

  return (
    <PolusPublicLayout view="entry">
      <PolusIntroPanel />

      <section className="polus-test-stage" aria-live="polite">
        <header className="polus-stage-header">
          <div className="polus-stage-title">
            <strong>Заполните свои данные</strong>
          </div>
        </header>

        <div className="polus-state-view">
          <div className="polus-start-layout">
            <form className="polus-form-grid" onSubmit={onSubmit}>
              {profileFields}
              <div className="polus-form-actions">
                <button className="polus-primary-action" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Запускаем тест...' : 'Начать тестирование'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </PolusPublicLayout>
  );
}
