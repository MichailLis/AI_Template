import { toast } from 'sonner';

import { normalizeInitial, resolveGroupValidationWarning } from './public-test-entry.helpers';

import type { StudentFormState } from './public-test-entry.types';
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
  studentName: string;
  studentLastInitial: string;
  studentMiddleInitial: string;
  educationOrganization: string;
  groupOrClass: string;
  consentAccepted: true;
}

interface StartSessionResponse {
  session: {
    sessionToken: string;
  };
}

interface CreatePublicTestEntryStartHandlerParams {
  code: string | undefined;
  formState: StudentFormState;
  linkData: LinkAccessSnapshot | undefined;
  startSession: (payload: {
    code: string;
    data: StartSessionRequestData;
  }) => Promise<StartSessionResponse>;
  navigate: NavigateFunction;
}

export const createPublicTestEntryStartHandler = ({
  code,
  formState,
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

    if (!formState.consentAccepted) {
      toast.error('Необходимо согласие на обработку персональных данных');
      return;
    }

    const effectiveEducationOrganization =
      linkData?.educationOrganization?.trim() ?? formState.educationOrganization.trim();

    if (!effectiveEducationOrganization) {
      toast.error('Укажите учебное заведение');
      return;
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
      return;
    }

    if (groupValidationWarning && validationMode === 'HINT') {
      toast.warning(groupValidationWarning);
    }

    try {
      const response = await startSession({
        code,
        data: {
          studentName: formState.studentName.trim(),
          studentLastInitial: normalizeInitial(formState.studentLastInitial),
          studentMiddleInitial: normalizeInitial(formState.studentMiddleInitial),
          educationOrganization: effectiveEducationOrganization,
          groupOrClass: normalizedGroupOrClass,
          consentAccepted: true,
        },
      });

      navigate(`/t/${code}/session/${response.session.sessionToken}`);
    } catch {
      toast.error('Не удалось начать тест. Проверьте корректность данных и попробуйте снова.');
    }
  };
};
