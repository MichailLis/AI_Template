import { GraduationCap } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  useTestsPublicControllerGetLinkAccess,
  useTestsPublicControllerStartSession,
} from '@/shared/api/generated/tests-public/tests-public';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

import { PublicTestOverviewPanel } from './public-test-overview-panel';
import { PublicTestRegistrationCard } from './public-test-registration-card';
import { PublicThemeLayout } from './public-theme-layout';

import type { StudentFormState } from './public-test-entry.types';

interface PublicEntryStateCardProps {
  title: string;
  description?: string;
  accentClassName: string;
  icon?: ReactNode;
}

const initialFormState: StudentFormState = {
  studentName: '',
  studentLastInitial: '',
  studentMiddleInitial: '',
  educationOrganization: '',
  groupOrClass: '',
  consentAccepted: false,
};

const normalizeInitial = (value: string) => value.trim().slice(0, 1).toUpperCase();

function PublicEntryStateCard({
  title,
  description,
  accentClassName,
  icon,
}: PublicEntryStateCardProps) {
  return (
    <PublicThemeLayout containerClassName="max-w-4xl">
      <Card className="relative w-full overflow-hidden border border-border/50 bg-card shadow-xl">
        <div className={`absolute inset-x-0 top-0 h-1 ${accentClassName}`} />
        <CardHeader className="pb-4 pt-6 text-center">
          <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
        </CardHeader>
        {description || icon ? (
          <CardContent className="px-6 pb-6 text-center">
            {icon ? <div className="mb-4 flex justify-center">{icon}</div> : null}
            {description ? <p className="text-muted-foreground">{description}</p> : null}
          </CardContent>
        ) : null}
      </Card>
    </PublicThemeLayout>
  );
}

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
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleStart = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!code) {
      toast.error('Некорректная ссылка на тест');
      return;
    }

    if (!formState.consentAccepted) {
      toast.error('Необходимо согласие на обработку персональных данных');
      return;
    }

    try {
      const response = await startMutation.mutateAsync({
        code,
        data: {
          studentName: formState.studentName.trim(),
          studentLastInitial: normalizeInitial(formState.studentLastInitial),
          studentMiddleInitial: normalizeInitial(formState.studentMiddleInitial),
          educationOrganization: formState.educationOrganization.trim(),
          groupOrClass: formState.groupOrClass.trim(),
          consentAccepted: true,
        },
      });

      navigate(`/t/${code}/session/${response.session.sessionToken}`);
    } catch {
      toast.error('Не удалось начать тест. Проверьте корректность данных и попробуйте снова.');
    }
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
          formState={formState}
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
