import { useState } from 'react';

import { initialDemographicFormState, initialFormState } from './public-test-entry.helpers';

import type { DemographicFormState, StudentFormState } from './public-test-entry.types';

const latinLettersPattern = /[A-Za-z]/g;
export const hasLatinLetters = (value: string) => /[A-Za-z]/.test(value);

export const removeLatinLetters = (value: string) => value.replace(latinLettersPattern, '');

export const sanitizeEducationFieldValue = <K extends keyof StudentFormState>(
  key: K,
  value: StudentFormState[K],
): StudentFormState[K] => {
  if (typeof value !== 'string') {
    return value;
  }

  const valueWithoutLatin = removeLatinLetters(value);

  if (key === 'studentName') {
    return valueWithoutLatin.trimStart().toUpperCase() as StudentFormState[K];
  }

  if (key === 'studentLastInitial' || key === 'studentMiddleInitial') {
    return valueWithoutLatin.trimStart().toUpperCase().slice(0, 1) as StudentFormState[K];
  }

  return valueWithoutLatin as StudentFormState[K];
};

export const sanitizeDemographicFieldValue = <K extends keyof DemographicFormState>(
  key: K,
  value: DemographicFormState[K],
): DemographicFormState[K] => {
  if (typeof value !== 'string') {
    return value;
  }

  if (key === 'age' || key === 'residence') {
    return removeLatinLetters(value) as DemographicFormState[K];
  }

  return value;
};

export function usePublicTestEntryState() {
  const [educationFormState, setEducationFormState] = useState<StudentFormState>(initialFormState);
  const [demographicFormState, setDemographicFormState] = useState<DemographicFormState>(
    initialDemographicFormState,
  );
  const [nameInputWarning, setNameInputWarning] = useState<string | null>(null);

  const updateEducationField = <K extends keyof StudentFormState>(
    key: K,
    value: StudentFormState[K],
  ) => {
    if (key === 'studentName' && typeof value === 'string') {
      if (hasLatinLetters(value)) {
        setNameInputWarning('Имя вводится кириллицей');
      } else {
        setNameInputWarning(null);
      }
    }

    const sanitizedValue = sanitizeEducationFieldValue(key, value);

    setEducationFormState((previousState) => ({
      ...previousState,
      [key]: sanitizedValue,
    }));
  };

  const updateDemographicField = <K extends keyof DemographicFormState>(
    key: K,
    value: DemographicFormState[K],
  ) => {
    const sanitizedValue = sanitizeDemographicFieldValue(key, value);

    setDemographicFormState((previousState) => ({
      ...previousState,
      [key]: sanitizedValue,
    }));
  };

  return {
    educationFormState,
    demographicFormState,
    nameInputWarning,
    updateEducationField,
    updateDemographicField,
  };
}
