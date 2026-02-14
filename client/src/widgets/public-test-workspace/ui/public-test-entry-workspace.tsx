import { type FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  useTestsPublicControllerGetLinkAccess,
  useTestsPublicControllerStartSession,
} from '@/shared/api/generated/tests-public/tests-public';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

interface StudentFormState {
  studentName: string;
  studentLastInitial: string;
  studentMiddleInitial: string;
  educationOrganization: string;
  groupOrClass: string;
  consentAccepted: boolean;
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
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10">
        <Card className="w-full border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Ссылка недействительна</CardTitle>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (linkQuery.isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10 text-sm text-slate-600">
        Загружаем параметры теста...
      </main>
    );
  }

  if (linkQuery.isError || !linkQuery.data) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10">
        <Card className="w-full border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Ссылка недоступна</CardTitle>
            <CardDescription>
              Проверьте корректность ссылки или обратитесь к администратору теста.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const link = linkQuery.data;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>{link.title}</CardTitle>
          <CardDescription>
            {link.description ?? 'Публичное тестирование'} | Вопросов: {link.questionCount}
            {link.timeLimitMinutes ? ` | Таймер: ${link.timeLimitMinutes} мин` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleStart}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="student-name">Имя</Label>
                <Input
                  id="student-name"
                  value={formState.studentName}
                  onChange={(event) => updateField('studentName', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-last-initial">Первая буква фамилии</Label>
                <Input
                  id="student-last-initial"
                  value={formState.studentLastInitial}
                  maxLength={1}
                  onChange={(event) => updateField('studentLastInitial', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-middle-initial">Первая буква отчества</Label>
                <Input
                  id="student-middle-initial"
                  value={formState.studentMiddleInitial}
                  maxLength={1}
                  onChange={(event) => updateField('studentMiddleInitial', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-education-org">Учебное заведение</Label>
                <Input
                  id="student-education-org"
                  value={formState.educationOrganization}
                  onChange={(event) => updateField('educationOrganization', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="student-group">Группа / класс</Label>
                <Input
                  id="student-group"
                  value={formState.groupOrClass}
                  onChange={(event) => updateField('groupOrClass', event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="rounded-md border bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium">
                Согласие на обработку персональных данных ({link.consentVersion})
              </p>
              <p className="mt-2 whitespace-pre-wrap text-xs text-slate-600">{link.consentText}</p>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formState.consentAccepted}
                  onChange={(event) => updateField('consentAccepted', event.target.checked)}
                />
                Даю согласие на обработку персональных данных
              </label>
            </div>

            <Button type="submit" disabled={startMutation.isPending}>
              {startMutation.isPending ? 'Запускаем...' : 'Перейти к тесту'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
