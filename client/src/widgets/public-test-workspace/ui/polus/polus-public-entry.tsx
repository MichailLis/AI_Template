import { polusAssets } from './polus-public-assets';
import { PolusEducationDemographicFields } from './polus-public-education-demographic-fields';
import { PolusPublicLayout } from './polus-public-layout';

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

const getTimeMetric = (timeLimitMinutes: number | null) =>
  timeLimitMinutes ? `${timeLimitMinutes}` : '15';

function PolusIntroPanel({ link }: { link: PublicLinkAccessResponseDto }) {
  return (
    <section className="polus-intro-panel" aria-labelledby="polus-page-title">
      <div>
        <p className="polus-section-label">Полюс роста</p>
        <h1 id="polus-page-title">Найди свой инженерный маршрут</h1>
        <p className="polus-lead">
          {link.description ||
            'Ответьте на вопросы, чтобы увидеть сильные стороны, стиль мышления и направления, где ваши навыки могут раскрыться быстрее всего.'}
        </p>
      </div>

      <div className="polus-metrics" aria-label="Параметры теста">
        <div className="polus-metric-row">
          <strong>{link.questionCount}</strong>
          <span>коротких вопросов без оценки правильности ответов</span>
        </div>
        <div className="polus-metric-row">
          <strong>{getTimeMetric(link.timeLimitMinutes)}</strong>
          <span>минут в среднем на спокойное прохождение</span>
        </div>
        <div className="polus-metric-row">
          <strong>1</strong>
          <span>персональная карта развития после завершения</span>
        </div>
      </div>

      <div className="polus-professor" aria-label="Сопровождение теста">
        <div className="polus-professor-card">
          <p>
            Профессор Полюс будет вести участника от входа до результата: спокойно, понятно и без
            лишнего давления.
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
        <label htmlFor="polus-student-name">Имя участника</label>
        <input
          id="polus-student-name"
          value={formState.studentName}
          onChange={(event) => onFieldChange('studentName', event.target.value)}
          required
        />
      </div>
      <div className="polus-field">
        <label htmlFor="polus-student-last-initial">Фамилия (1-я буква)</label>
        <input
          id="polus-student-last-initial"
          value={formState.studentLastInitial}
          maxLength={1}
          onChange={(event) =>
            onFieldChange('studentLastInitial', event.target.value.toUpperCase())
          }
          required
        />
      </div>
      <div className="polus-field">
        <label htmlFor="polus-student-middle-initial">Отчество (1-я буква)</label>
        <input
          id="polus-student-middle-initial"
          value={formState.studentMiddleInitial}
          maxLength={1}
          onChange={(event) =>
            onFieldChange('studentMiddleInitial', event.target.value.toUpperCase())
          }
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
          required
        />
      </div>
      <div className="polus-field polus-field-wide">
        <label htmlFor="polus-student-group">Класс / группа</label>
        <input
          id="polus-student-group"
          value={formState.groupOrClass}
          onChange={(event) => onFieldChange('groupOrClass', event.target.value)}
          placeholder={link.groupValidationExample || '10А, ИС-21'}
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
      <p className="polus-form-section-title">Дополнительная анкета</p>
      <div className="polus-field">
        <label htmlFor="polus-student-gender">1. Укажите, пожалуйста Ваш пол?</label>
        <select
          id="polus-student-gender"
          value={formState.gender}
          onChange={(event) =>
            onFieldChange('gender', event.target.value as DemographicFormState['gender'])
          }
          required
        >
          <option value="">Выберите пол</option>
          <option value="MALE">Мужской</option>
          <option value="FEMALE">Женский</option>
        </select>
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
            required
          />
        </div>
      ) : null}
      <div className="polus-field polus-field-wide">
        <label htmlFor="polus-student-residence">3. Укажите Ваше место жительства?</label>
        <input
          id="polus-student-residence"
          value={formState.residence}
          onChange={(event) => onFieldChange('residence', event.target.value)}
          required
        />
      </div>
      <div className="polus-field polus-field-wide">
        <label htmlFor="polus-student-education-level">
          4. Укажите уровень Вашего образования:
        </label>
        <select
          id="polus-student-education-level"
          value={formState.educationLevel}
          onChange={(event) =>
            onFieldChange(
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
      <PolusIntroPanel link={link} />

      <section className="polus-test-stage" aria-live="polite">
        <header className="polus-stage-header">
          <div className="polus-stage-title">
            <p>Готовность к старту</p>
            <strong>Заполните данные участника</strong>
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
