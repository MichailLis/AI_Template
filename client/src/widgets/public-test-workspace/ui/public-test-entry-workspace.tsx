import { BarChart3, Clock3, FileText, GraduationCap, Sparkles, Target } from 'lucide-react';
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

import { PublicThemeLayout } from './public-theme-layout';

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
      <PublicThemeLayout containerClassName="max-w-4xl">
        <Card className="w-full shadow-xl border border-border/50 overflow-hidden relative bg-card">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-red-400 to-red-500" />
          <CardHeader className="text-center pb-4 pt-6">
            <CardTitle className="text-2xl font-bold text-red-600">
              Ссылка недействительна
            </CardTitle>
          </CardHeader>
        </Card>
      </PublicThemeLayout>
    );
  }

  if (linkQuery.isLoading) {
    return (
      <PublicThemeLayout containerClassName="max-w-4xl">
        <Card className="w-full shadow-xl border border-border/50 overflow-hidden relative bg-card">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary" />
          <CardContent className="px-6 py-10 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-gradient-to-br from-primary to-accent p-4 rounded-xl shadow-md">
                <GraduationCap className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">Загрузка параметров теста</p>
                <p className="text-sm text-muted-foreground">Пожалуйста, подождите...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </PublicThemeLayout>
    );
  }

  if (linkQuery.isError || !linkQuery.data) {
    return (
      <PublicThemeLayout containerClassName="max-w-4xl">
        <Card className="w-full shadow-xl border border-border/50 overflow-hidden relative bg-card">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-red-400 to-red-500" />
          <CardHeader className="text-center pb-4 pt-6">
            <CardTitle className="text-2xl font-bold text-red-600">Ссылка недоступна</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 text-center">
            <p className="text-muted-foreground">
              Проверьте корректность ссылки или обратитесь к администратору теста.
            </p>
          </CardContent>
        </Card>
      </PublicThemeLayout>
    );
  }

  const link = linkQuery.data;

  return (
    <PublicThemeLayout containerClassName="max-w-6xl py-6 md:py-8 lg:py-10">
      <div className="grid grid-cols-1 gap-8 lg:min-h-[calc(100vh-7rem)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
        <div className="order-2 space-y-6 lg:order-1">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Система профориентации
            </div>

            <h1 className="bg-gradient-to-br from-primary via-accent to-secondary bg-clip-text text-[clamp(2rem,4vw,3.2rem)] font-bold leading-tight text-transparent">
              {link.title}
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              {link.description ?? 'Публичное тестирование'}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-card/85 p-4 shadow-sm backdrop-blur">
              <p className="text-sm text-muted-foreground">Вопросов</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{link.questionCount}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/85 p-4 shadow-sm backdrop-blur">
              <p className="text-sm text-muted-foreground">Попыток</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {link.maxAttemptsPerStudent}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/85 p-4 shadow-sm backdrop-blur">
              <p className="text-sm text-muted-foreground">Таймер</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {link.timeLimitMinutes ? `${link.timeLimitMinutes} мин` : 'Без лимита'}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border/60 bg-card/85 p-5 shadow-sm backdrop-blur">
            <h4 className="font-semibold text-foreground">Что вы получите</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 rounded-md bg-primary/12 p-1.5 text-primary">
                  <Target className="h-4 w-4" />
                </span>
                <span>Диагностику сильных сторон и профессиональных склонностей.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 rounded-md bg-primary/12 p-1.5 text-primary">
                  <BarChart3 className="h-4 w-4" />
                </span>
                <span>Подробный анализ результатов после завершения теста.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 rounded-md bg-primary/12 p-1.5 text-primary">
                  <FileText className="h-4 w-4" />
                </span>
                <span>Рекомендации для выбора образовательной и карьерной траектории.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 rounded-md bg-primary/12 p-1.5 text-primary">
                  <Clock3 className="h-4 w-4" />
                </span>
                <span>
                  Среднее время прохождения:{' '}
                  {link.timeLimitMinutes ? `${link.timeLimitMinutes} минут` : '15-20 минут'}.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <Card className="relative overflow-hidden border border-border/60 bg-card shadow-xl lg:sticky lg:top-8">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary" />

            <CardHeader className="space-y-3 pb-4 pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-br from-primary via-accent to-secondary bg-clip-text text-transparent">
                    Регистрация
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Заполните анкету для начала тестирования
                  </CardDescription>
                </div>
                <div className="ml-4 shrink-0 rounded-xl bg-gradient-to-br from-primary to-accent p-3 shadow-md">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-6 pb-6">
              <form className="space-y-4" onSubmit={handleStart}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="student-name" className="font-medium">
                      Имя
                    </Label>
                    <Input
                      id="student-name"
                      value={formState.studentName}
                      onChange={(event) => updateField('studentName', event.target.value)}
                      required
                      className="h-11"
                      placeholder="Введите ваше имя"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-last-initial" className="font-medium">
                      Фамилия (1-я буква)
                    </Label>
                    <Input
                      id="student-last-initial"
                      value={formState.studentLastInitial}
                      maxLength={1}
                      onChange={(event) =>
                        updateField('studentLastInitial', event.target.value.toUpperCase())
                      }
                      required
                      placeholder="И"
                      className="text-lg uppercase text-center h-11 font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-middle-initial" className="font-medium">
                      Отчество (1-я буква)
                    </Label>
                    <Input
                      id="student-middle-initial"
                      value={formState.studentMiddleInitial}
                      maxLength={1}
                      onChange={(event) =>
                        updateField('studentMiddleInitial', event.target.value.toUpperCase())
                      }
                      required
                      placeholder="О"
                      className="text-lg uppercase text-center h-11 font-semibold"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="student-education-org" className="font-medium">
                      Учебное заведение
                    </Label>
                    <Input
                      id="student-education-org"
                      value={formState.educationOrganization}
                      onChange={(event) => updateField('educationOrganization', event.target.value)}
                      required
                      className="h-11"
                      placeholder="Школа, колледж, вуз..."
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="student-group" className="font-medium">
                      Группа / класс
                    </Label>
                    <Input
                      id="student-group"
                      value={formState.groupOrClass}
                      onChange={(event) => updateField('groupOrClass', event.target.value)}
                      required
                      className="h-11"
                      placeholder="10А, ИС-21..."
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-gradient-to-br from-muted/40 to-muted/20 p-4 text-sm">
                  <p className="font-semibold text-foreground">
                    Согласие на обработку персональных данных ({link.consentVersion})
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                    {link.consentText}
                  </p>
                  <label className="mt-3 flex items-center gap-3 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.consentAccepted}
                      onChange={(event) => updateField('consentAccepted', event.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="font-medium text-foreground">
                      Даю согласие на{' '}
                      <span className="text-primary">обработку персональных данных</span>
                    </span>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={startMutation.isPending}
                  className="w-full h-12 font-medium bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-md hover:shadow-lg transition-all"
                >
                  {startMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Запускаем...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Перейти к тесту
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicThemeLayout>
  );
}
