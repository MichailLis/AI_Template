import { GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  useTestsPublicControllerGetLinkAccess,
  useTestsPublicControllerStartSession,
} from '@/shared/api/generated/tests-public/tests-public';

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

import type { DemographicFormState, StudentFormState } from './public-test-entry.types';

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
    setEducationFormState((previousState) => ({
      ...previousState,
      [key]: value,
    }));
  };

  const updateDemographicField = <K extends keyof DemographicFormState>(
    key: K,
    value: DemographicFormState[K],
  ) => {
    setDemographicFormState((previousState) => ({
      ...previousState,
      [key]: value,
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
      entryProfileMode === 'EDUCATION'
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

  return (
    <PublicThemeLayout containerClassName="max-w-6xl py-6 md:py-8 lg:py-10">
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
            isSubmitting={startMutation.isPending}
            onSubmit={handleStart}
            onFieldChange={updateDemographicField}
          />
        ) : (
          <PublicTestRegistrationCard
            formState={registrationFormState}
            lockedEducationOrganization={link.educationOrganization}
            groupValidationMode={link.groupValidationMode}
            groupValidationExample={link.groupValidationExample}
            groupValidationHint={link.groupValidationHint}
            groupValidationWarning={currentGroupValidationWarning}
            isSubmitting={startMutation.isPending}
            onSubmit={handleStart}
            onFieldChange={updateEducationField}
          />
        )}
      </div>
    </PublicThemeLayout>
  );
}
