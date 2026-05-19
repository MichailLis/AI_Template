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

type DemographicProfilePayload = Pick<
  StartSessionRequestData,
  'gender' | 'age' | 'residence' | 'educationLevel'
>;

type EducationProfilePayload = Pick<
  StartSessionRequestData,
  'studentName' | 'educationOrganization' | 'groupOrClass'
>;

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

const buildDemographicProfilePayload = (
  formState: DemographicFormState,
): DemographicProfilePayload | null => {
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
    gender: formState.gender,
    age,
    residence,
    educationLevel: formState.educationLevel,
  };
};

const buildDemographicPayload = (
  formState: DemographicFormState,
): StartSessionRequestData | null => {
  if (!formState.consentAccepted) {
    toast.error('Необходимо согласие на обработку персональных данных');
    return null;
  }

  const demographicProfile = buildDemographicProfilePayload(formState);

  if (!demographicProfile) {
    return null;
  }

  return {
    entryProfileMode: 'DEMOGRAPHIC',
    ...demographicProfile,
    consentAccepted: true,
  };
};

const buildEducationProfilePayload = (
  formState: StudentFormState,
  linkData: LinkAccessSnapshot | undefined,
): EducationProfilePayload | null => {
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
    studentName: formState.studentName.trim(),
    educationOrganization: effectiveEducationOrganization,
    groupOrClass: normalizedGroupOrClass,
  };
};

const buildEducationPayload = (
  formState: StudentFormState,
  linkData: LinkAccessSnapshot | undefined,
): StartSessionRequestData | null => {
  const educationProfile = buildEducationProfilePayload(formState, linkData);

  if (!educationProfile) {
    return null;
  }

  return {
    entryProfileMode: 'EDUCATION',
    ...educationProfile,
    studentLastInitial: normalizeInitial(formState.studentLastInitial),
    studentMiddleInitial: normalizeInitial(formState.studentMiddleInitial),
    consentAccepted: true,
  };
};

const buildEducationDemographicPayload = (
  educationFormState: StudentFormState,
  demographicFormState: DemographicFormState,
  linkData: LinkAccessSnapshot | undefined,
): StartSessionRequestData | null => {
  const educationProfile = buildEducationProfilePayload(educationFormState, linkData);
  const demographicProfile = buildDemographicProfilePayload(demographicFormState);

  if (!educationProfile || !demographicProfile) {
    return null;
  }

  return {
    entryProfileMode: 'EDUCATION_DEMOGRAPHIC',
    ...educationProfile,
    ...demographicProfile,
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

    let data: StartSessionRequestData | null;

    if (entryProfileMode === 'DEMOGRAPHIC') {
      data = buildDemographicPayload(demographicFormState);
    } else if (entryProfileMode === 'EDUCATION_DEMOGRAPHIC') {
      data = buildEducationDemographicPayload(educationFormState, demographicFormState, linkData);
    } else {
      data = buildEducationPayload(educationFormState, linkData);
    }

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
