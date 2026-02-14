import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  useTestsPublicControllerFinishSession,
  useTestsPublicControllerGetSession,
  useTestsPublicControllerSaveAnswers,
} from '@/shared/api/generated/tests-public/tests-public';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

type AnswerDraft = Record<number, unknown>;

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
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-10 text-sm text-red-700">
        Некорректная ссылка сессии теста.
      </main>
    );
  }

  if (sessionQuery.isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-10 text-sm text-slate-600">
        Загружаем сессию теста...
      </main>
    );
  }

  if (sessionQuery.isError || !session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-10 text-sm text-red-700">
        Сессия недоступна или уже завершена.
      </main>
    );
  }

  if (session.shortCode !== code) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-10 text-sm text-red-700">
        Код ссылки не совпадает с сессией теста.
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Прохождение теста</CardTitle>
          <CardDescription>
            Попытка #{session.attemptNumber} | Статус: {session.status}
            {session.expiresAt
              ? ` | Время окончания: ${new Date(session.expiresAt).toLocaleTimeString()}`
              : ''}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {session.questions.map((question) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {question.order}. {question.title}
              </CardTitle>
              {question.description ? (
                <CardDescription>{question.description}</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent>
              {question.type === 'OPEN_TEXT' ? (
                <Textarea
                  value={
                    typeof getCurrentAnswer(question.id) === 'string'
                      ? (getCurrentAnswer(question.id) as string)
                      : ''
                  }
                  onChange={(event) => setQuestionAnswer(question.id, event.target.value)}
                  placeholder="Введите ответ"
                />
              ) : null}

              {question.type === 'SINGLE_CHOICE' ? (
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label key={option.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={`single-${question.id}`}
                        checked={getCurrentAnswer(question.id) === option.value}
                        onChange={() => setQuestionAnswer(question.id, option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              ) : null}

              {question.type === 'MULTI_CHOICE' ? (
                <div className="space-y-2">
                  {question.options.map((option) => {
                    const currentAnswer = getCurrentAnswer(question.id);
                    const currentValue = Array.isArray(currentAnswer)
                      ? (currentAnswer as string[])
                      : [];
                    const checked = currentValue.includes(option.value);

                    return (
                      <label key={option.id} className="flex items-center gap-2 text-sm">
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
                    const value =
                      typeof getCurrentAnswer(question.id) === 'number'
                        ? (getCurrentAnswer(question.id) as number)
                        : min;

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
                            setQuestionAnswer(question.id, Number.parseInt(event.target.value, 10))
                          }
                          className="w-full"
                        />
                      </>
                    );
                  })()}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleSaveAnswers()}
          disabled={saveAnswersMutation.isPending || session.status !== 'IN_PROGRESS'}
        >
          {saveAnswersMutation.isPending ? 'Сохраняем...' : 'Сохранить ответы'}
        </Button>
        <Button
          type="button"
          onClick={() => void handleFinish()}
          disabled={finishMutation.isPending || session.status !== 'IN_PROGRESS'}
        >
          {finishMutation.isPending ? 'Завершаем...' : 'Завершить тест'}
        </Button>
      </div>
    </main>
  );
}
