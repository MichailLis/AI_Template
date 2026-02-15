import { GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  useTestsPublicControllerGetLinkAccess,
  useTestsPublicControllerStartSession,
} from '@/shared/api/generated/tests-public/tests-public';

import { PublicEntryStateCard } from './public-entry-state-card';
import { createPublicTestEntryStartHandler } from './public-test-entry-submit';
import { initialFormState, resolveGroupValidationWarning } from './public-test-entry.helpers';
import { PublicTestOverviewPanel } from './public-test-overview-panel';
import { PublicTestRegistrationCard } from './public-test-registration-card';
import { PublicThemeLayout } from './public-theme-layout';

import type { StudentFormState } from './public-test-entry.types';

export function PublicTestEntryWorkspace() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [formState, setFormState] = useState<StudentFormState>(initialFormState);

  const linkQuery = useTestsPublicControllerGetLinkAccess(code ?? '', {
    query: {
      enabled: Boolean(code),
      retry: false,
    },
  });
  const startMutation = useTestsPublicControllerStartSession();

  const updateField = <K extends keyof StudentFormState>(key: K, value: StudentFormState[K]) => {
    setFormState((previousState) => ({
      ...previousState,
      [key]: value,
    }));
  };

  const handleStart = createPublicTestEntryStartHandler({
    code,
    formState,
    linkData: linkQuery.data
      ? {
          educationOrganization: linkQuery.data.educationOrganization,
          groupValidationMode: linkQuery.data.groupValidationMode,
          groupValidationPattern: linkQuery.data.groupValidationPattern,
          groupValidationHint: linkQuery.data.groupValidationHint,
        }
      : undefined,
    startSession: startMutation.mutateAsync,
    navigate,
  });

  if (!code) {
    return (
      <PublicEntryStateCard
        title="Ссылка недействительна"
        accentClassName="bg-gradient-to-r from-red-500 via-red-400 to-red-500"
      />
    );
  }

  if (linkQuery.isLoading) {
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
  const registrationFormState = {
    ...formState,
    educationOrganization: link.educationOrganization ?? formState.educationOrganization,
  };
  const currentGroupValidationWarning = resolveGroupValidationWarning({
    groupValue: formState.groupOrClass.trim(),
    groupValidationMode: link.groupValidationMode,
    groupValidationPattern: link.groupValidationPattern,
    groupValidationHint: link.groupValidationHint,
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

        <PublicTestRegistrationCard
          formState={registrationFormState}
          lockedEducationOrganization={link.educationOrganization}
          groupValidationMode={link.groupValidationMode}
          groupValidationExample={link.groupValidationExample}
          groupValidationHint={link.groupValidationHint}
          groupValidationWarning={currentGroupValidationWarning}
          consentVersion={link.consentVersion}
          consentText={link.consentText}
          isSubmitting={startMutation.isPending}
          onSubmit={handleStart}
          onFieldChange={updateField}
        />
      </div>
    </PublicThemeLayout>
  );
}
