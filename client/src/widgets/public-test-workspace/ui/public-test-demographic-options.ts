import type { StudentEducationLevel, StudentGender } from './public-test-entry.types';

export const studentGenderOptions = [
  { value: 'MALE', label: 'Мужской' },
  { value: 'FEMALE', label: 'Женский' },
] as const satisfies readonly { value: StudentGender; label: string }[];

export const studentEducationLevelOptions = [
  { value: 'BASIC_GENERAL', label: 'Основное общее' },
  { value: 'SECONDARY_GENERAL', label: 'Среднее общее' },
  { value: 'SECONDARY_SPECIAL', label: 'Среднее специальное' },
  {
    value: 'INCOMPLETE_HIGHER_FROM_YEAR_3',
    label: 'Неоконченное высшее (начиная с 3 курса)',
  },
  { value: 'HIGHER', label: 'Высшее' },
] as const satisfies readonly { value: StudentEducationLevel; label: string }[];
