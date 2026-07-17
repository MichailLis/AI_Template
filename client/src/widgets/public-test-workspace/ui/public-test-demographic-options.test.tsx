import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PolusEducationDemographicFields } from './polus/polus-public-education-demographic-fields';
import { PolusPublicEntry } from './polus/polus-public-entry';
import {
  studentEducationLevelOptions,
  studentGenderOptions,
} from './public-test-demographic-options';
import { PublicTestDemographicProfileCard } from './public-test-demographic-profile-card';
import { RegistrationDemographicFields } from './public-test-registration-demographic-fields';

import type { DemographicFormState, StudentFormState } from './public-test-entry.types';
import type { PublicLinkAccessResponseDto } from '@/shared/api/model';

const expectedGenderOptions = [
  { value: 'MALE', label: 'Мужской' },
  { value: 'FEMALE', label: 'Женский' },
] as const;

const expectedEducationLevelOptions = [
  { value: 'BASIC_GENERAL', label: 'Основное общее' },
  { value: 'SECONDARY_GENERAL', label: 'Среднее общее' },
  { value: 'SECONDARY_SPECIAL', label: 'Среднее специальное' },
  {
    value: 'INCOMPLETE_HIGHER_FROM_YEAR_3',
    label: 'Неоконченное высшее (начиная с 3 курса)',
  },
  { value: 'HIGHER', label: 'Высшее' },
] as const;

const demographicFormState: DemographicFormState = {
  gender: '',
  age: '',
  residence: '',
  educationLevel: '',
  consentAccepted: false,
};

const registrationFormState: StudentFormState = {
  studentName: '',
  studentLastInitial: '',
  studentMiddleInitial: '',
  educationOrganization: '',
  groupOrClass: '',
  consentAccepted: false,
};

const link: PublicLinkAccessResponseDto = {
  shortCode: 'POLUS2026',
  title: 'Инженерный маршрут',
  description: 'Короткая диагностика',
  entryProfileMode: 'DEMOGRAPHIC',
  publicTemplate: 'POLUS',
  educationOrganization: null,
  groupValidationMode: 'NONE',
  groupValidationPattern: null,
  groupValidationExample: null,
  groupValidationHint: null,
  questionCount: 18,
  maxAttemptsPerStudent: 1,
  timeLimitMinutes: 15,
  allowResume: true,
  startsAt: null,
  endsAt: null,
  consentVersion: 'v1',
  consentText: 'Согласие',
  personalData: {
    processingMode: 'PUBLIC',
    operatorFullName: 'ООО "Оператор тестирования"',
    operatorShortName: null,
    privacyPolicyUrl: '/privacy',
    consentDocumentUrl: null,
    logoUrl: null,
  },
  publicBranding: null,
};

const getNativeOptions = (select: HTMLElement) =>
  within(select)
    .getAllByRole('option')
    .filter((option) => option.getAttribute('value') !== '')
    .map((option) => ({
      value: option.getAttribute('value'),
      label: option.textContent,
    }));

const assertNativeDemographicOptions = () => {
  expect(getNativeOptions(screen.getByRole('combobox', { name: /^Пол$/i }))).toEqual(
    expectedGenderOptions,
  );
  expect(getNativeOptions(screen.getByRole('combobox', { name: /Уровень образования/i }))).toEqual(
    expectedEducationLevelOptions,
  );
};

const getOpenPolusOptions = async (select: HTMLElement) => {
  const user = userEvent.setup();
  await user.click(select);

  const options = screen.getAllByRole('option').map((option) => ({
    value: option.id.replace(/^.*-/, ''),
    label: option.textContent,
  }));
  await user.keyboard('{Escape}');

  return options;
};

describe('public test demographic options', () => {
  afterEach(() => {
    cleanup();
  });

  it('exports exact gender and education options for public student forms', () => {
    expect(studentGenderOptions).toEqual(expectedGenderOptions);
    expect(studentEducationLevelOptions).toEqual(expectedEducationLevelOptions);
    expect(
      studentEducationLevelOptions.find(
        (option) => option.value === 'INCOMPLETE_HIGHER_FROM_YEAR_3',
      )?.label,
    ).toBe('Неоконченное высшее (начиная с 3 курса)');
  });

  it('uses the shared options in the standard demographic form', () => {
    render(
      <PublicTestDemographicProfileCard
        formState={demographicFormState}
        personalData={link.personalData}
        isSubmitting={false}
        onSubmit={vi.fn()}
        onFieldChange={vi.fn()}
      />,
    );

    assertNativeDemographicOptions();
  });

  it('uses the shared options in the hybrid registration demographic fields', () => {
    render(
      <RegistrationDemographicFields formState={demographicFormState} onFieldChange={vi.fn()} />,
    );

    assertNativeDemographicOptions();
  });

  it('uses the shared options in the Polus demographic-only form', async () => {
    render(
      <PolusPublicEntry
        link={link}
        entryProfileMode="DEMOGRAPHIC"
        demographicFormState={demographicFormState}
        registrationFormState={registrationFormState}
        currentGroupValidationWarning={null}
        isSubmitting={false}
        onSubmit={vi.fn()}
        onEducationFieldChange={vi.fn()}
        onDemographicFieldChange={vi.fn()}
      />,
    );

    expect(await getOpenPolusOptions(screen.getByRole('combobox', { name: /пол/i }))).toEqual(
      expectedGenderOptions,
    );
    expect(await getOpenPolusOptions(screen.getByRole('combobox', { name: /уровень/i }))).toEqual(
      expectedEducationLevelOptions,
    );
  });

  it('uses the shared options in the Polus education-demographic fields', async () => {
    render(
      <PolusEducationDemographicFields
        demographicFormState={demographicFormState}
        registrationFormState={registrationFormState}
        link={link}
        warning={null}
        onEducationFieldChange={vi.fn()}
        onDemographicFieldChange={vi.fn()}
      />,
    );

    expect(await getOpenPolusOptions(screen.getByRole('combobox', { name: /^Пол$/i }))).toEqual(
      expectedGenderOptions,
    );
    expect(
      await getOpenPolusOptions(screen.getByRole('combobox', { name: /Уровень образования/i })),
    ).toEqual(expectedEducationLevelOptions);
  });
});
