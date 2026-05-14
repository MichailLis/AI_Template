import { toast } from 'sonner';

import { normalizeInitial, resolveGroupValidationWarning } from './public-test-entry.helpers';

import type {
  DemographicFormState,
  EntryProfileMode,
  StudentEducationLevel,
  StudentFormState,
  StudentGender,
} from './public-test-entry.types';
import type { GroupValidationMode } from '@/shared/lib/group-validation';
import type { FormEvent } from 'react';
import type { NavigateFunction } from 'react-router-dom';

interface LinkAccessSnapshot {
  educationOrganization: string | null;
  groupValidationMode: GroupValidationMode;
  groupValidationPattern: string | null;
  groupValidationHint: string | null;
}

interface StartSessionRequestData {
  entryProfileMode?: EntryProfileMode;
  studentName?: string;
  studentLastInitial?: string;
  studentMiddleInitial?: string;
  educationOrganization?: string;
  groupOrClass?: string;
  gender?: StudentGender;
  age?: number;
  residence?: string;
  educationLevel?: StudentEducationLevel;
  consentAccepted: true;
}

interface StartSessionResponse {
  session: {
    sessionToken: string;
  };
}

interface CreatePublicTestEntryStartHandlerParams {
  code: string | undefined;
  entryProfileMode: EntryProfileMode;
  educationFormState: StudentFormState;
  demographicFormState: DemographicFormState;
  linkData: LinkAccessSnapshot | undefined;
  startSession: (payload: {
    code: string;
    data: StartSessionRequestData;
  }) => Promise<StartSessionResponse>;
  navigate: NavigateFunction;
}

const buildDemographicPayload = (
  formState: DemographicFormState,
): StartSessionRequestData | null => {
  if (!formState.consentAccepted) {
    toast.error('Необходимо согласие на обработку персональных данных');
    return null;
  }

  if (!formState.gender) {
    toast.error('Укажите пол');
    return null;
  }

  const age = Number.parseInt(formState.age.trim(), 10);

  if (!Number.isInteger(age) || age < 1 || age > 120) {
    toast.error('Укажите корректный возраст');
    return null;
  }

  const residence = formState.residence.trim();

  if (!residence) {
    toast.error('Укажите место жительства');
    return null;
  }

  if (!formState.educationLevel) {
    toast.error('Укажите уровень образования');
    return null;
  }

  return {
    entryProfileMode: 'DEMOGRAPHIC',
    gender: formState.gender,
    age,
    residence,
    educationLevel: formState.educationLevel,
    consentAccepted: true,
  };
};

const buildEducationPayload = (
  formState: StudentFormState,
  linkData: LinkAccessSnapshot | undefined,
): StartSessionRequestData | null => {
  if (!formState.consentAccepted) {
    toast.error('Необходимо согласие на обработку персональных данных');
    return null;
  }

  const effectiveEducationOrganization =
    linkData?.educationOrganization?.trim() ?? formState.educationOrganization.trim();

  if (!effectiveEducationOrganization) {
    toast.error('Укажите учебное заведение');
    return null;
  }

  const normalizedGroupOrClass = formState.groupOrClass.trim();
  const validationMode = linkData?.groupValidationMode ?? 'NONE';
  const groupValidationWarning = resolveGroupValidationWarning({
    groupValue: normalizedGroupOrClass,
    groupValidationMode: validationMode,
    groupValidationPattern: linkData?.groupValidationPattern ?? null,
    groupValidationHint: linkData?.groupValidationHint ?? null,
  });

  if (groupValidationWarning && validationMode === 'STRICT') {
    toast.error(groupValidationWarning);
    return null;
  }

  if (groupValidationWarning && validationMode === 'HINT') {
    toast.warning(groupValidationWarning);
  }

  return {
    entryProfileMode: 'EDUCATION',
    studentName: formState.studentName.trim(),
    studentLastInitial: normalizeInitial(formState.studentLastInitial),
    studentMiddleInitial: normalizeInitial(formState.studentMiddleInitial),
    educationOrganization: effectiveEducationOrganization,
    groupOrClass: normalizedGroupOrClass,
    consentAccepted: true,
  };
};

export const createPublicTestEntryStartHandler = ({
  code,
  entryProfileMode,
  educationFormState,
  demographicFormState,
  linkData,
  startSession,
  navigate,
}: CreatePublicTestEntryStartHandlerParams) => {
  return async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!code) {
      toast.error('Некорректная ссылка на тест');
      return;
    }

    const data =
      entryProfileMode === 'DEMOGRAPHIC'
        ? buildDemographicPayload(demographicFormState)
        : buildEducationPayload(educationFormState, linkData);

    if (!data) {
      return;
    }

    try {
      const response = await startSession({
        code,
        data,
      });

      navigate(`/t/${code}/session/${response.session.sessionToken}`);
    } catch {
      toast.error('Не удалось начать тест. Проверьте корректность данных и попробуйте снова.');
    }
  };
};
