import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { testsPublicControllerSaveAnswers } from '@/shared/api/generated/tests-public/tests-public';

import { buildSessionAnswers } from './public-test-run-answer.helpers';

import type {
  PublicTestAnswerDraft,
  PublicTestAutosaveStatus,
  PublicTestSession,
} from './public-test-run.types';

type SessionAnswersPayload = ReturnType<typeof buildSessionAnswers>;
export type SavedPublicAnswerPayload = Array<{
  questionId: number;
  answerPayload: string | string[] | number;
}>;

interface UsePublicTestRunAutosaveParams {
  sessionToken: string | undefined;
  session: PublicTestSession | null;
  answerDraft: PublicTestAnswerDraft;
  effectiveAnswers: PublicTestAnswerDraft;
  serverAnswerMap: PublicTestAnswerDraft;
  onSavedAnswers: (answers: SavedPublicAnswerPayload) => void;
}

const AUTOSAVE_DEBOUNCE_MS = 900;

const getAnswersSignature = (answers: SessionAnswersPayload) => JSON.stringify(answers);

export function usePublicTestRunAutosave({
  sessionToken,
  session,
  answerDraft,
  effectiveAnswers,
  serverAnswerMap,
  onSavedAnswers,
}: UsePublicTestRunAutosaveParams) {
  const [autosaveStatus, setAutosaveStatus] = useState<PublicTestAutosaveStatus>('idle');
  const [autosaveError, setAutosaveError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const autosaveRunIdRef = useRef(0);
  const inFlightAutosaveRef = useRef<Promise<void> | null>(null);
  const lastAutosavedAnswersSignatureRef = useRef<string | null>(null);

  const hasAnswerDraft = Object.keys(answerDraft).length > 0;
  const autosaveAnswers = useMemo(() => {
    if (!session) {
      return [];
    }

    return buildSessionAnswers(session.questions, effectiveAnswers);
  }, [effectiveAnswers, session]);

  const clearAutosaveTimer = useCallback(() => {
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  }, []);

  const cancelQueuedAutosave = useCallback(() => {
    clearAutosaveTimer();
    autosaveRunIdRef.current += 1;
  }, [clearAutosaveTimer]);

  const waitForInFlightAutosave = useCallback(async () => {
    const inFlightAutosave = inFlightAutosaveRef.current;

    if (inFlightAutosave) {
      await inFlightAutosave;
    }
  }, []);

  const markAnswerChanged = useCallback(() => {
    setAutosaveStatus('pending');
    setAutosaveError(null);
  }, []);

  const markAnswersSaved = useCallback((answers: SessionAnswersPayload) => {
    lastAutosavedAnswersSignatureRef.current = getAnswersSignature(answers);
    setAutosaveStatus('saved');
    setAutosaveError(null);
  }, []);

  useEffect(() => {
    if (!sessionToken || !session || session.status !== 'IN_PROGRESS') {
      clearAutosaveTimer();
      return;
    }

    if (!hasAnswerDraft || autosaveAnswers.length === 0) {
      clearAutosaveTimer();
      return;
    }

    const answersSignature = getAnswersSignature(autosaveAnswers);
    const serverAnswersSignature = getAnswersSignature(
      buildSessionAnswers(session.questions, serverAnswerMap),
    );

    if (
      answersSignature === serverAnswersSignature ||
      answersSignature === lastAutosavedAnswersSignatureRef.current
    ) {
      clearAutosaveTimer();
      return;
    }

    let isActive = true;
    const autosaveRunId = autosaveRunIdRef.current + 1;
    autosaveRunIdRef.current = autosaveRunId;

    autosaveTimerRef.current = window.setTimeout(() => {
      setAutosaveStatus('saving');
      const autosaveRequest = testsPublicControllerSaveAnswers(sessionToken, {
        answers: autosaveAnswers,
      })
        .then((response) => {
          if (!isActive || autosaveRunIdRef.current !== autosaveRunId) {
            return;
          }

          markAnswersSaved(autosaveAnswers);
          onSavedAnswers(response.answers);
        })
        .catch(() => {
          if (!isActive || autosaveRunIdRef.current !== autosaveRunId) {
            return;
          }

          setAutosaveStatus('error');
          setAutosaveError('Не удалось сохранить ответы');
        })
        .finally(() => {
          if (inFlightAutosaveRef.current === autosaveRequest) {
            inFlightAutosaveRef.current = null;
          }
        });
      inFlightAutosaveRef.current = autosaveRequest;
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      isActive = false;
      clearAutosaveTimer();
    };
  }, [
    autosaveAnswers,
    clearAutosaveTimer,
    hasAnswerDraft,
    markAnswersSaved,
    onSavedAnswers,
    serverAnswerMap,
    session,
    sessionToken,
  ]);

  const visibleAutosaveStatus =
    hasAnswerDraft && autosaveAnswers.length === 0 ? 'idle' : autosaveStatus;

  return {
    autosaveStatus: visibleAutosaveStatus,
    autosaveError: visibleAutosaveStatus === 'error' ? autosaveError : null,
    cancelQueuedAutosave,
    markAnswerChanged,
    markAnswersSaved,
    waitForInFlightAutosave,
  };
}
