import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  useTestsPublicControllerFinishSession,
  useTestsPublicControllerGetSession,
  useTestsPublicControllerSaveAnswers,
} from '@/shared/api/generated/tests-public/tests-public';

import {
  buildSessionAnswers,
  getEffectiveQuestionAnswer,
  hasMeaningfulQuestionAnswer,
  reconcileAnswerDraftAfterSave,
} from './public-test-run-answer.helpers';
import {
  usePublicTestRunAutosave,
  type SavedPublicAnswerPayload,
} from './use-public-test-run-autosave';

import type { PublicTestAnswerDraft, PublicTestSession } from './public-test-run.types';

interface AnswerOverride {
  questionId: number;
  value: unknown;
}

const createServerAnswerMap = (session: PublicTestSession | null) =>
  session?.answers.reduce<PublicTestAnswerDraft>((acc, answer) => {
    acc[answer.questionId] = answer.answerPayload;
    return acc;
  }, {}) ?? {};

const mergeAnswerDrafts = (
  serverAnswerMap: PublicTestAnswerDraft,
  answerDraft: PublicTestAnswerDraft,
) => ({
  ...serverAnswerMap,
  ...answerDraft,
});

const countAnsweredQuestions = (
  session: PublicTestSession | null,
  effectiveAnswers: PublicTestAnswerDraft,
) =>
  session?.questions.reduce((acc, question) => {
    const answer = getEffectiveQuestionAnswer(question, effectiveAnswers);
    return hasMeaningfulQuestionAnswer(question.type, answer) ? acc + 1 : acc;
  }, 0) ?? 0;

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

  const serverAnswerMap = useMemo(() => createServerAnswerMap(session), [session]);

  const effectiveAnswers = useMemo(
    () => mergeAnswerDrafts(serverAnswerMap, answerDraft),
    [answerDraft, serverAnswerMap],
  );
  const handleSavedAnswers = useCallback((savedAnswers: SavedPublicAnswerPayload) => {
    setAnswerDraft((prev) => reconcileAnswerDraftAfterSave(prev, savedAnswers));
  }, []);
  const autosave = usePublicTestRunAutosave({
    sessionToken,
    session,
    answerDraft,
    effectiveAnswers,
    serverAnswerMap,
    onSavedAnswers: handleSavedAnswers,
  });

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
    autosave.markAnswerChanged();
  };

  const handleSaveAnswers = async () => {
    if (!sessionToken || !session) {
      return;
    }

    const answers = buildSessionAnswers(session.questions, effectiveAnswers);

    if (answers.length === 0) {
      toast.error('Нет данных для сохранения');
      return;
    }

    try {
      autosave.cancelQueuedAutosave();
      await autosave.waitForInFlightAutosave();
      const response = await saveAnswersMutation.mutateAsync({
        sessionToken,
        data: { answers },
      });
      setAnswerDraft((prev) => reconcileAnswerDraftAfterSave(prev, response.answers));
      autosave.markAnswersSaved(answers);
      toast.success('Ответы сохранены');
    } catch {
      toast.error('Не удалось сохранить ответы');
    }
  };

  const handleFinish = async (answerOverride?: AnswerOverride) => {
    if (!sessionToken || !code || !session) {
      return;
    }

    const answers = buildSessionAnswers(
      session.questions,
      answerOverride
        ? { ...effectiveAnswers, [answerOverride.questionId]: answerOverride.value }
        : effectiveAnswers,
    );

    try {
      autosave.cancelQueuedAutosave();
      await autosave.waitForInFlightAutosave();
      if (answers.length > 0) {
        const saveResponse = await saveAnswersMutation.mutateAsync({
          sessionToken,
          data: { answers },
        });
        setAnswerDraft((prev) => reconcileAnswerDraftAfterSave(prev, saveResponse.answers));
        autosave.markAnswersSaved(answers);
      }

      const response = await finishMutation.mutateAsync({ sessionToken });
      navigate(`/t/${code}/result/${response.sessionToken}`);
    } catch {
      toast.error('Не удалось завершить тест');
    }
  };

  const totalQuestionsCount = session?.questions.length ?? 0;
  const answeredQuestionsCount = countAnsweredQuestions(session, effectiveAnswers);

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
    autosaveStatus: autosave.autosaveStatus,
    autosaveError: autosave.autosaveError,
  };
}
