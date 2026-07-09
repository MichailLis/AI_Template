import type { DemographicFormState, StudentFormState } from './public-test-entry.types';
import type { GroupValidationMode } from '@/shared/lib/group-validation';

interface GroupValidationWarningParams {
  groupValue: string;
  groupValidationMode: GroupValidationMode;
  groupValidationPattern: string | null;
  groupValidationHint: string | null;
}

export const initialFormState: StudentFormState = {
  studentName: '',
  studentLastInitial: '',
  studentMiddleInitial: '',
  educationOrganization: '',
  groupOrClass: '',
  consentAccepted: false,
};

export const initialDemographicFormState: DemographicFormState = {
  gender: '',
  age: '',
  residence: '',
  educationLevel: '',
  consentAccepted: false,
};

export const normalizeInitial = (value: string) => value.trim().slice(0, 1).toUpperCase();

const matchesGroupPattern = (value: string, pattern: string) => {
  try {
    return new RegExp(pattern, 'u').test(value);
  } catch {
    return true;
  }
};

export const resolveGroupValidationWarning = ({
  groupValue,
  groupValidationMode,
  groupValidationPattern,
  groupValidationHint,
}: GroupValidationWarningParams) => {
  if (groupValidationMode === 'NONE' || !groupValidationPattern || !groupValue) {
    return null;
  }

  if (matchesGroupPattern(groupValue, groupValidationPattern)) {
    return null;
  }

  return (
    groupValidationHint ||
    'Формат поля «Группа / класс» не соответствует требованиям учебного заведения'
  );
};
