import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  useTestsPublicControllerFinishSession,
  useTestsPublicControllerGetSession,
  useTestsPublicControllerSaveAnswers,
} from '@/shared/api/generated/tests-public/tests-public';

import { getSliderQuestionMeta } from './public-question-card.utils';

import type { PublicTestAnswerDraft, PublicTestQuestion } from './public-test-run.types';

interface AnswerOverride {
  questionId: number;
  value: unknown;
}

const hasMeaningfulAnswer = (value: unknown) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null;
};

const getEffectiveQuestionAnswer = (
  question: PublicTestQuestion,
  mergedAnswers: PublicTestAnswerDraft,
) => {
  const answer = mergedAnswers[question.id];

  if (answer !== undefined) {
    return answer;
  }

  if (question.type === 'SLIDER') {
    return getSliderQuestionMeta(question.settings, question.sliderBands, answer).value;
  }

  return answer;
};

const buildSessionAnswers = (
  questions: PublicTestQuestion[],
  mergedAnswers: PublicTestAnswerDraft,
) =>
  questions
    .map((question) => ({
      questionId: question.id,
      answerPayload: getEffectiveQuestionAnswer(question, mergedAnswers),
    }))
    .filter((item) => item.answerPayload !== undefined);

export function usePublicTestRunWorkspace() {
  const { code, sessionToken } = useParams<{ code: string; sessionToken: string }>();
  const navigate = useNavigate();

  const [answerDraft, setAnswerDraft] = useState<PublicTestAnswerDraft>({});

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
      return {} as PublicTestAnswerDraft;
    }

    return session.answers.reduce<PublicTestAnswerDraft>((acc, answer) => {
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

    const answers = buildSessionAnswers(session.questions, mergedAnswers);

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

  const handleFinish = async (answerOverride?: AnswerOverride) => {
    if (!sessionToken || !code || !session) {
      return;
    }

    const mergedAnswers = {
      ...serverAnswerMap,
      ...answerDraft,
      ...(answerOverride ? { [answerOverride.questionId]: answerOverride.value } : {}),
    };

    const answers = buildSessionAnswers(session.questions, mergedAnswers);

    try {
      if (answers.length > 0) {
        await saveAnswersMutation.mutateAsync({
          sessionToken,
          data: { answers },
        });
      }

      const response = await finishMutation.mutateAsync({ sessionToken });
      navigate(`/t/${code}/result/${response.sessionToken}`);
    } catch {
      toast.error('Не удалось завершить тест');
    }
  };

  const totalQuestionsCount = session?.questions.length ?? 0;
  const effectiveAnswers = {
    ...serverAnswerMap,
    ...answerDraft,
  };
  const answeredQuestionsCount =
    session?.questions.reduce((acc, question) => {
      const answer = getEffectiveQuestionAnswer(question, effectiveAnswers);
      return hasMeaningfulAnswer(answer) ? acc + 1 : acc;
    }, 0) ?? 0;

  return {
    code,
    sessionToken,
    sessionQuery,
    saveAnswersMutation,
    finishMutation,
    session,
    totalQuestionsCount,
    answeredQuestionsCount,
    getCurrentAnswer,
    setQuestionAnswer,
    handleSaveAnswers,
    handleFinish,
  };
}
