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
