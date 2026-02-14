import { Clock3, ListChecks, Save, SendHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  useTestsPublicControllerFinishSession,
  useTestsPublicControllerGetSession,
  useTestsPublicControllerSaveAnswers,
} from '@/shared/api/generated/tests-public/tests-public';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import { PublicThemeLayout } from './public-theme-layout';

type AnswerDraft = Record<number, unknown>;

const hasMeaningfulAnswer = (value: unknown) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null;
};

export function PublicTestRunWorkspace() {
  const { code, sessionToken } = useParams<{ code: string; sessionToken: string }>();
  const navigate = useNavigate();

  const [answerDraft, setAnswerDraft] = useState<AnswerDraft>({});

  const sessionQuery = useTestsPublicControllerGetSession(sessionToken ?? '', {
    query: {
      enabled: Boolean(sessionToken),
      retry: false,
      refetchInterval: 5000,
    },
  });

  const saveAnswersMutation = useTestsPublicControllerSaveAnswers();
  const finishMutation = useTestsPublicControllerFinishSession();
  const session = sessionQuery.data?.session ?? null;

  const serverAnswerMap = useMemo(() => {
    if (!session) {
      return {} as AnswerDraft;
    }

    return session.answers.reduce<AnswerDraft>((acc, answer) => {
      acc[answer.questionId] = answer.answerPayload;
      return acc;
    }, {});
  }, [session]);

  const getCurrentAnswer = (questionId: number) => {
    if (Object.prototype.hasOwnProperty.call(answerDraft, questionId)) {
      return answerDraft[questionId];
    }

    return serverAnswerMap[questionId];
  };

  const setQuestionAnswer = (questionId: number, value: unknown) => {
    setAnswerDraft((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSaveAnswers = async () => {
    if (!sessionToken || !session) {
      return;
    }

    const mergedAnswers = {
      ...serverAnswerMap,
      ...answerDraft,
    };

    const answers = session.questions
      .map((question) => ({
        questionId: question.id,
        answerPayload: mergedAnswers[question.id],
      }))
      .filter((item) => item.answerPayload !== undefined);

    if (answers.length === 0) {
      toast.error('Нет данных для сохранения');
      return;
    }

    try {
      await saveAnswersMutation.mutateAsync({
        sessionToken,
        data: { answers },
      });
      toast.success('Ответы сохранены');
    } catch {
      toast.error('Не удалось сохранить ответы');
    }
  };

  const handleFinish = async () => {
    if (!sessionToken || !code) {
      return;
    }

    try {
      const response = await finishMutation.mutateAsync({ sessionToken });
      navigate(`/t/${code}/result/${response.sessionToken}`);
    } catch {
      toast.error('Не удалось завершить тест');
    }
  };

  if (!code || !sessionToken) {
    return (
      <PublicThemeLayout containerClassName="max-w-4xl">
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-10 text-sm text-red-700">
          Некорректная ссылка сессии теста.
        </div>
      </PublicThemeLayout>
    );
  }

  if (sessionQuery.isLoading) {
    return (
      <PublicThemeLayout containerClassName="max-w-4xl">
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-10 text-sm text-muted-foreground">
          Загружаем сессию теста...
        </div>
      </PublicThemeLayout>
    );
  }

  if (sessionQuery.isError || !session) {
    return (
      <PublicThemeLayout containerClassName="max-w-4xl">
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-10 text-sm text-red-700">
          Сессия недоступна или уже завершена.
        </div>
      </PublicThemeLayout>
    );
  }

  if (session.shortCode !== code) {
    return (
      <PublicThemeLayout containerClassName="max-w-4xl">
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-10 text-sm text-red-700">
          Код ссылки не совпадает с сессией теста.
        </div>
      </PublicThemeLayout>
    );
  }

  const totalQuestionsCount = session.questions.length;
  const answeredQuestionsCount = session.questions.reduce((acc, question) => {
    const answer = getCurrentAnswer(question.id);
    return hasMeaningfulAnswer(answer) ? acc + 1 : acc;
  }, 0);

  return (
    <PublicThemeLayout containerClassName="max-w-4xl">
      <Card className="mb-6 border-border/60 bg-card shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">Прохождение теста</CardTitle>
              <CardDescription>
                Сохраните ответы и завершите тест после заполнения всех вопросов.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Попытка #{session.attemptNumber}</Badge>
              {session.expiresAt ? (
                <Badge variant="outline">
                  До {new Date(session.expiresAt).toLocaleTimeString()}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
              <p className="text-xs text-muted-foreground">Вопросов</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{totalQuestionsCount}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
              <p className="text-xs text-muted-foreground">Заполнено</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{answeredQuestionsCount}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
              <p className="text-xs text-muted-foreground">Лимит времени</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {session.timeLimitMinutes ? `${session.timeLimitMinutes} мин` : 'Без лимита'}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {session.questions.map((question) => {
          const currentAnswer = getCurrentAnswer(question.id);

          return (
            <Card key={question.id} className="border-border/60 bg-card shadow-sm">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">
                    {question.order}. {question.title}
                  </CardTitle>
                  {question.required ? <Badge variant="outline">Обязательный</Badge> : null}
                </div>
                {question.description ? (
                  <CardDescription>{question.description}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-3">
                {question.type === 'OPEN_TEXT' ? (
                  <Textarea
                    value={typeof currentAnswer === 'string' ? currentAnswer : ''}
                    onChange={(event) => setQuestionAnswer(question.id, event.target.value)}
                    placeholder="Введите ответ"
                    className="min-h-28"
                  />
                ) : null}

                {question.type === 'SINGLE_CHOICE' ? (
                  <div className="space-y-2">
                    {question.options.map((option) => {
                      const checked = currentAnswer === option.value;

                      return (
                        <label
                          key={option.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                            checked
                              ? 'border-primary bg-primary/5'
                              : 'border-border bg-card hover:bg-muted/30'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`single-${question.id}`}
                            checked={checked}
                            onChange={() => setQuestionAnswer(question.id, option.value)}
                            className="h-4 w-4 border-border text-primary"
                          />
                          {option.label}
                        </label>
                      );
                    })}
                  </div>
                ) : null}

                {question.type === 'MULTI_CHOICE' ? (
                  <div className="space-y-2">
                    {question.options.map((option) => {
                      const currentValue = Array.isArray(currentAnswer)
                        ? (currentAnswer as string[])
                        : [];
                      const checked = currentValue.includes(option.value);

                      return (
                        <label
                          key={option.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                            checked
                              ? 'border-primary bg-primary/5'
                              : 'border-border bg-card hover:bg-muted/30'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              if (event.target.checked) {
                                setQuestionAnswer(question.id, [...currentValue, option.value]);
                              } else {
                                setQuestionAnswer(
                                  question.id,
                                  currentValue.filter((value) => value !== option.value),
                                );
                              }
                            }}
                            className="h-4 w-4 border-border text-primary"
                          />
                          {option.label}
                        </label>
                      );
                    })}
                  </div>
                ) : null}

                {question.type === 'SLIDER' ? (
                  <div className="space-y-3">
                    {(() => {
                      const settings =
                        typeof question.settings === 'object' && question.settings !== null
                          ? (question.settings as Record<string, unknown>)
                          : null;

                      const fallbackMin = question.sliderBands[0]?.minValue ?? 0;
                      const fallbackMax =
                        question.sliderBands.length > 0
                          ? question.sliderBands[question.sliderBands.length - 1].maxValue
                          : 100;
                      const min = typeof settings?.min === 'number' ? settings.min : fallbackMin;
                      const max = typeof settings?.max === 'number' ? settings.max : fallbackMax;
                      const step = typeof settings?.step === 'number' ? settings.step : 1;
                      const value = typeof currentAnswer === 'number' ? currentAnswer : min;

                      return (
                        <>
                          <Label>{value}</Label>
                          <input
                            type="range"
                            min={min}
                            max={max}
                            step={step}
                            value={value}
                            onChange={(event) =>
                              setQuestionAnswer(
                                question.id,
                                Number.parseInt(event.target.value, 10),
                              )
                            }
                            className="w-full accent-primary"
                          />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{min}</span>
                            <span>{max}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/95 p-3 shadow-lg backdrop-blur md:sticky md:bottom-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleSaveAnswers()}
          disabled={saveAnswersMutation.isPending || session.status !== 'IN_PROGRESS'}
          className="min-w-44"
        >
          {saveAnswersMutation.isPending ? (
            'Сохраняем...'
          ) : (
            <span className="inline-flex items-center gap-2">
              <Save className="h-4 w-4" />
              Сохранить ответы
            </span>
          )}
        </Button>
        <Button
          type="button"
          onClick={() => void handleFinish()}
          disabled={finishMutation.isPending || session.status !== 'IN_PROGRESS'}
          className="min-w-44 bg-gradient-to-r from-primary to-accent hover:opacity-95"
        >
          {finishMutation.isPending ? (
            'Завершаем...'
          ) : (
            <span className="inline-flex items-center gap-2">
              <SendHorizontal className="h-4 w-4" />
              Завершить тест
            </span>
          )}
        </Button>
        <div className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Clock3 className="h-4 w-4" />
          <ListChecks className="h-4 w-4" />
          {answeredQuestionsCount}/{totalQuestionsCount} заполнено
        </div>
      </div>
    </PublicThemeLayout>
  );
}
