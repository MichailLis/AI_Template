import { GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  useTestsPublicControllerGetLinkAccess,
  useTestsPublicControllerStartSession,
} from '@/shared/api/generated/tests-public/tests-public';

import { PolusPublicEntry } from './polus/polus-public-entry';
import { PublicEntryStateCard } from './public-entry-state-card';
import { PublicTestDemographicProfileCard } from './public-test-demographic-profile-card';
import { createPublicTestEntryStartHandler } from './public-test-entry-submit';
import {
  initialDemographicFormState,
  initialFormState,
  resolveGroupValidationWarning,
} from './public-test-entry.helpers';
import { PublicTestOverviewPanel } from './public-test-overview-panel';
import { PublicTestRegistrationCard } from './public-test-registration-card';
import { PublicThemeLayout } from './public-theme-layout';

import type {
  DemographicFormState,
  EntryProfileMode,
  StudentFormState,
} from './public-test-entry.types';
import type { PublicLinkAccessResponseDto } from '@/shared/api/model';
import type { FormEvent } from 'react';

type EducationFieldChangeHandler = <K extends keyof StudentFormState>(
  key: K,
  value: StudentFormState[K],
) => void;

type DemographicFieldChangeHandler = <K extends keyof DemographicFormState>(
  key: K,
  value: DemographicFormState[K],
) => void;

const latinLettersPattern = /[A-Za-z]/g;

const removeLatinLetters = (value: string) => value.replace(latinLettersPattern, '');

const sanitizeEducationFieldValue = <K extends keyof StudentFormState>(
  key: K,
  value: StudentFormState[K],
): StudentFormState[K] => {
  if (typeof value !== 'string') {
    return value;
  }

  const valueWithoutLatin = removeLatinLetters(value);

  if (key === 'studentName') {
    return valueWithoutLatin.toUpperCase() as StudentFormState[K];
  }

  if (key === 'studentLastInitial' || key === 'studentMiddleInitial') {
    return valueWithoutLatin.toUpperCase().slice(0, 1) as StudentFormState[K];
  }

  return valueWithoutLatin as StudentFormState[K];
};

const sanitizeDemographicFieldValue = <K extends keyof DemographicFormState>(
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

interface StandardPublicTestEntryProps {
  link: PublicLinkAccessResponseDto;
  entryProfileMode: EntryProfileMode;
  demographicFormState: DemographicFormState;
  registrationFormState: StudentFormState;
  currentGroupValidationWarning: string | null;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEducationFieldChange: EducationFieldChangeHandler;
  onDemographicFieldChange: DemographicFieldChangeHandler;
}

function PublicEntryLoadingState() {
  return (
    <PublicEntryStateCard
      title="Загрузка параметров теста"
      description="Пожалуйста, подождите..."
      accentClassName="bg-gradient-to-r from-primary via-accent to-secondary"
      icon={
        <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-4 shadow-md">
          <GraduationCap className="h-8 w-8 animate-pulse text-white" />
        </div>
      }
    />
  );
}

function StandardPublicTestEntry({
  link,
  entryProfileMode,
  demographicFormState,
  registrationFormState,
  currentGroupValidationWarning,
  isSubmitting,
  onSubmit,
  onEducationFieldChange,
  onDemographicFieldChange,
}: StandardPublicTestEntryProps) {
  return (
    <PublicThemeLayout
      branding={link.publicBranding}
      containerClassName="max-w-6xl py-6 md:py-8 lg:py-10"
    >
      <div className="grid grid-cols-1 gap-8 lg:min-h-[calc(100vh-7rem)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
        <PublicTestOverviewPanel
          title={link.title}
          description={link.description}
          questionCount={link.questionCount}
          maxAttemptsPerStudent={link.maxAttemptsPerStudent}
          timeLimitMinutes={link.timeLimitMinutes}
        />

        {entryProfileMode === 'DEMOGRAPHIC' ? (
          <PublicTestDemographicProfileCard
            formState={demographicFormState}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            onFieldChange={onDemographicFieldChange}
          />
        ) : (
          <PublicTestRegistrationCard
            formState={registrationFormState}
            demographicFormState={demographicFormState}
            lockedEducationOrganization={link.educationOrganization}
            groupValidationMode={link.groupValidationMode}
            groupValidationExample={link.groupValidationExample}
            groupValidationHint={link.groupValidationHint}
            groupValidationWarning={currentGroupValidationWarning}
            showDemographicFields={entryProfileMode === 'EDUCATION_DEMOGRAPHIC'}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            onFieldChange={onEducationFieldChange}
            onDemographicFieldChange={onDemographicFieldChange}
          />
        )}
      </div>
    </PublicThemeLayout>
  );
}

export function PublicTestEntryWorkspace() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [educationFormState, setEducationFormState] = useState<StudentFormState>(initialFormState);
  const [demographicFormState, setDemographicFormState] = useState<DemographicFormState>(
    initialDemographicFormState,
  );

  const linkQuery = useTestsPublicControllerGetLinkAccess(code ?? '', {
    query: {
      enabled: Boolean(code),
      retry: false,
    },
  });
  const startMutation = useTestsPublicControllerStartSession();

  const updateEducationField = <K extends keyof StudentFormState>(
    key: K,
    value: StudentFormState[K],
  ) => {
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

  if (!code) {
    return (
      <PublicEntryStateCard
        title="Ссылка недействительна"
        accentClassName="bg-gradient-to-r from-red-500 via-red-400 to-red-500"
      />
    );
  }

  if (linkQuery.isLoading) {
    return <PublicEntryLoadingState />;
  }

  if (linkQuery.isError || !linkQuery.data) {
    return (
      <PublicEntryStateCard
        title="Ссылка недоступна"
        description="Проверьте корректность ссылки или обратитесь к администратору теста."
        accentClassName="bg-gradient-to-r from-red-500 via-red-400 to-red-500"
      />
    );
  }

  const link = linkQuery.data;
  const entryProfileMode = link.entryProfileMode;
  const registrationFormState = {
    ...educationFormState,
    educationOrganization: link.educationOrganization ?? educationFormState.educationOrganization,
  };
  const currentGroupValidationWarning = resolveGroupValidationWarning({
    groupValue: educationFormState.groupOrClass.trim(),
    groupValidationMode: link.groupValidationMode,
    groupValidationPattern: link.groupValidationPattern,
    groupValidationHint: link.groupValidationHint,
  });
  const handleStart = createPublicTestEntryStartHandler({
    code,
    entryProfileMode,
    educationFormState,
    demographicFormState,
    linkData:
      entryProfileMode !== 'DEMOGRAPHIC'
        ? {
            educationOrganization: link.educationOrganization,
            groupValidationMode: link.groupValidationMode,
            groupValidationPattern: link.groupValidationPattern,
            groupValidationHint: link.groupValidationHint,
          }
        : undefined,
    startSession: startMutation.mutateAsync,
    navigate,
  });

  if (link.publicTemplate === 'POLUS') {
    return (
      <PolusPublicEntry
        link={link}
        entryProfileMode={entryProfileMode}
        demographicFormState={demographicFormState}
        registrationFormState={registrationFormState}
        currentGroupValidationWarning={currentGroupValidationWarning}
        isSubmitting={startMutation.isPending}
        onSubmit={handleStart}
        onEducationFieldChange={updateEducationField}
        onDemographicFieldChange={updateDemographicField}
      />
    );
  }

  return (
    <StandardPublicTestEntry
      link={link}
      entryProfileMode={entryProfileMode}
      demographicFormState={demographicFormState}
      registrationFormState={registrationFormState}
      currentGroupValidationWarning={currentGroupValidationWarning}
      isSubmitting={startMutation.isPending}
      onSubmit={handleStart}
      onEducationFieldChange={updateEducationField}
      onDemographicFieldChange={updateDemographicField}
    />
  );
}
