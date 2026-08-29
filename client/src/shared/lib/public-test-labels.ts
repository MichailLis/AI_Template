type StudentGender = 'MALE' | 'FEMALE';

type StudentEducationLevel =
  | 'BASIC_GENERAL'
  | 'SECONDARY_GENERAL'
  | 'SECONDARY_SPECIAL'
  | 'INCOMPLETE_HIGHER_FROM_YEAR_3'
  | 'HIGHER';

type PublicTemplate = 'STANDARD' | 'POLUS';

type EntryProfileMode = 'DEMOGRAPHIC' | 'EDUCATION' | 'EDUCATION_DEMOGRAPHIC';

export const studentGenderLabels: Record<StudentGender, string> = {
  MALE: 'Мужской',
  FEMALE: 'Женский',
};

export const studentEducationLevelLabels: Record<StudentEducationLevel, string> = {
  BASIC_GENERAL: 'Основное общее',
  SECONDARY_GENERAL: 'Среднее общее',
  SECONDARY_SPECIAL: 'Среднее специальное',
  INCOMPLETE_HIGHER_FROM_YEAR_3: 'Неоконченное высшее',
  HIGHER: 'Высшее',
};

/**
 * Option lists for the public entry forms. Both templates render the same choices, and before this
 * existed each of the four forms carried its own copy.
 *
 * The education labels here are deliberately longer than studentEducationLevelLabels above:
 * a student choosing a level needs "(начиная с 3 курса)" to pick correctly, while an admin reading
 * a table of attempts needs the phrase to fit in a column. Two audiences, two wordings, one source
 * of truth for each.
 */
export const studentGenderOptions: ReadonlyArray<{ value: StudentGender; label: string }> = [
  { value: 'MALE', label: studentGenderLabels.MALE },
  { value: 'FEMALE', label: studentGenderLabels.FEMALE },
];

export const studentEducationLevelOptions: ReadonlyArray<{
  value: StudentEducationLevel;
  label: string;
}> = [
  { value: 'BASIC_GENERAL', label: 'Основное общее' },
  { value: 'SECONDARY_GENERAL', label: 'Среднее общее' },
  { value: 'SECONDARY_SPECIAL', label: 'Среднее специальное' },
  { value: 'INCOMPLETE_HIGHER_FROM_YEAR_3', label: 'Неоконченное высшее (начиная с 3 курса)' },
  { value: 'HIGHER', label: 'Высшее' },
];

export const publicTemplateLabels: Record<PublicTemplate, string> = {
  STANDARD: 'Текущий',
  POLUS: 'Polus',
};

export const entryProfileModeLabels: Record<EntryProfileMode, string> = {
  DEMOGRAPHIC: 'Демографическая',
  EDUCATION: 'Учебная',
  EDUCATION_DEMOGRAPHIC: 'Учебная + демографическая',
};

export const getPublicTemplateLabel = (template: PublicTemplate) => publicTemplateLabels[template];

export const getEntryProfileModeLabel = (mode: EntryProfileMode) => entryProfileModeLabels[mode];
