import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { createPublicTestEntryStartHandler } from './public-test-entry-submit';

import type { DemographicFormState, StudentFormState } from './public-test-entry.types';
import type { FormEvent } from 'react';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

const createSubmitEvent = () =>
  ({
    preventDefault: vi.fn(),
  }) as unknown as FormEvent<HTMLFormElement>;

const validFormState: StudentFormState = {
  studentName: ' Иван ',
  studentLastInitial: ' и ',
  studentMiddleInitial: ' о ',
  educationOrganization: ' Лицей 42 ',
  groupOrClass: ' ИС-21 ',
  consentAccepted: true,
};

const validDemographicFormState: DemographicFormState = {
  gender: 'FEMALE',
  age: '17',
  residence: 'Казань',
  educationLevel: 'SECONDARY_GENERAL',
  consentAccepted: true,
};

describe('createPublicTestEntryStartHandler', () => {
  it('submits normalized student data and navigates to the returned session', async () => {
    const startSession = vi.fn().mockResolvedValue({
      session: {
        sessionToken: 'session-token',
      },
    });
    const navigate = vi.fn();
    const event = createSubmitEvent();

    await createPublicTestEntryStartHandler({
      code: 'CODE1',
      entryProfileMode: 'EDUCATION',
      educationFormState: validFormState,
      demographicFormState: validDemographicFormState,
      linkData: undefined,
      startSession,
      navigate,
    })(event);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(startSession).toHaveBeenCalledWith({
      code: 'CODE1',
      data: {
        entryProfileMode: 'EDUCATION',
        studentName: 'Иван',
        studentLastInitial: 'И',
        studentMiddleInitial: 'О',
        educationOrganization: 'Лицей 42',
        groupOrClass: 'ИС-21',
        consentAccepted: true,
      },
    });
    expect(navigate).toHaveBeenCalledWith('/t/CODE1/session/session-token');
  });

  it('blocks strict group validation before starting a session', async () => {
    const startSession = vi.fn();
    const navigate = vi.fn();

    await createPublicTestEntryStartHandler({
      code: 'CODE1',
      entryProfileMode: 'EDUCATION',
      educationFormState: {
        ...validFormState,
        groupOrClass: 'БИ-21',
      },
      demographicFormState: validDemographicFormState,
      linkData: {
        educationOrganization: null,
        groupValidationMode: 'STRICT',
        groupValidationPattern: '^ИС-\\d+$',
        groupValidationHint: 'Use ИС-21',
      },
      startSession,
      navigate,
    })(createSubmitEvent());

    expect(startSession).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('uses a link-bound education organization and warns on hint validation', async () => {
    const startSession = vi.fn().mockResolvedValue({
      session: {
        sessionToken: 'session-token',
      },
    });
    const navigate = vi.fn();

    await createPublicTestEntryStartHandler({
      code: 'CODE1',
      entryProfileMode: 'EDUCATION',
      educationFormState: {
        ...validFormState,
        educationOrganization: '',
        groupOrClass: 'БИ-21',
      },
      demographicFormState: validDemographicFormState,
      linkData: {
        educationOrganization: 'Лицей из ссылки',
        groupValidationMode: 'HINT',
        groupValidationPattern: '^ИС-\\d+$',
        groupValidationHint: 'Use ИС-21',
      },
      startSession,
      navigate,
    })(createSubmitEvent());

    expect(startSession).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          educationOrganization: 'Лицей из ссылки',
          groupOrClass: 'БИ-21',
        }),
      }),
    );
    expect(toast.warning).toHaveBeenCalledWith('Use ИС-21');
    expect(navigate).toHaveBeenCalledWith('/t/CODE1/session/session-token');
  });

  it('submits normalized demographic data and navigates to the returned session', async () => {
    const startSession = vi.fn().mockResolvedValue({
      session: {
        sessionToken: 'session-token',
      },
    });
    const navigate = vi.fn();
    const event = createSubmitEvent();

    await createPublicTestEntryStartHandler({
      code: 'CODE1',
      entryProfileMode: 'DEMOGRAPHIC',
      educationFormState: validFormState,
      demographicFormState: {
        gender: 'MALE',
        age: ' 18 ',
        residence: ' Казань ',
        educationLevel: 'SECONDARY_SPECIAL',
        consentAccepted: true,
      },
      linkData: undefined,
      startSession,
      navigate,
    })(event);

    expect(startSession).toHaveBeenCalledWith({
      code: 'CODE1',
      data: {
        entryProfileMode: 'DEMOGRAPHIC',
        gender: 'MALE',
        age: 18,
        residence: 'Казань',
        educationLevel: 'SECONDARY_SPECIAL',
        consentAccepted: true,
      },
    });
    expect(navigate).toHaveBeenCalledWith('/t/CODE1/session/session-token');
  });

  it('submits education and demographic data for hybrid profile mode', async () => {
    const startSession = vi.fn().mockResolvedValue({
      session: {
        sessionToken: 'session-token',
      },
    });
    const navigate = vi.fn();

    await createPublicTestEntryStartHandler({
      code: 'CODE1',
      entryProfileMode: 'EDUCATION_DEMOGRAPHIC',
      educationFormState: {
        ...validFormState,
        studentLastInitial: '',
        studentMiddleInitial: '',
      },
      demographicFormState: {
        gender: 'MALE',
        age: ' 18 ',
        residence: ' Казань ',
        educationLevel: 'SECONDARY_SPECIAL',
        consentAccepted: true,
      },
      linkData: {
        educationOrganization: 'Лицей из ссылки',
        groupValidationMode: 'NONE',
        groupValidationPattern: null,
        groupValidationHint: null,
      },
      startSession,
      navigate,
    })(createSubmitEvent());

    expect(startSession).toHaveBeenCalledWith({
      code: 'CODE1',
      data: {
        entryProfileMode: 'EDUCATION_DEMOGRAPHIC',
        studentName: 'Иван',
        educationOrganization: 'Лицей из ссылки',
        groupOrClass: 'ИС-21',
        gender: 'MALE',
        age: 18,
        residence: 'Казань',
        educationLevel: 'SECONDARY_SPECIAL',
        consentAccepted: true,
      },
    });
    expect(navigate).toHaveBeenCalledWith('/t/CODE1/session/session-token');
  });

  it('blocks incomplete demographic data before starting a session', async () => {
    const startSession = vi.fn();
    const navigate = vi.fn();

    await createPublicTestEntryStartHandler({
      code: 'CODE1',
      entryProfileMode: 'DEMOGRAPHIC',
      educationFormState: validFormState,
      demographicFormState: {
        ...validDemographicFormState,
        age: '',
      },
      linkData: undefined,
      startSession,
      navigate,
    })(createSubmitEvent());

    expect(startSession).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
