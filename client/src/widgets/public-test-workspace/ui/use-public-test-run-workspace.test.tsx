import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePublicTestRunWorkspace } from './use-public-test-run-workspace';

import type { PublicTestSession } from './public-test-run.types';

const publicTestApiMocks = vi.hoisted(() => ({
  finishSession: vi.fn(),
  getSession: vi.fn(),
  navigate: vi.fn(),
  saveAnswers: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => publicTestApiMocks.navigate,
  useParams: () => ({ code: 'DEMO2026', sessionToken: 'session-token' }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/shared/api/generated/tests-public/tests-public', () => ({
  testsPublicControllerSaveAnswers: (sessionToken: string, data: unknown) =>
    publicTestApiMocks.saveAnswers({ data, sessionToken }),
  useTestsPublicControllerFinishSession: () => ({
    isPending: false,
    mutateAsync: publicTestApiMocks.finishSession,
  }),
  useTestsPublicControllerGetSession: (...args: unknown[]) =>
    publicTestApiMocks.getSession(...args),
  useTestsPublicControllerSaveAnswers: () => ({
    isPending: false,
    mutateAsync: publicTestApiMocks.saveAnswers,
  }),
}));

const createSession = (): PublicTestSession => ({
  sessionToken: 'session-token',
  shortCode: 'DEMO2026',
  publicTemplate: 'STANDARD',
  publicBranding: null,
  attemptNumber: 1,
  status: 'IN_PROGRESS',
  startedAt: '2026-05-27T00:00:00.000Z',
  expiresAt: null,
  finishedAt: null,
  timeLimitMinutes: null,
  questions: [
    {
      id: 1,
      type: 'OPEN_TEXT',
      title: 'Question 1',
      description: null,
      required: true,
      order: 1,
      settings: null,
      options: [],
      sliderBands: [],
    },
  ],
  answers: [],
});

describe('usePublicTestRunWorkspace', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    publicTestApiMocks.getSession.mockReturnValue({
      data: { session: createSession() },
      isError: false,
      isLoading: false,
    });
    publicTestApiMocks.saveAnswers.mockResolvedValue({
      sessionToken: 'session-token',
      status: 'IN_PROGRESS',
      answers: [
        {
          questionId: 1,
          answerPayload: 'hello',
          updatedAt: '2026-05-27T00:00:01.000Z',
        },
      ],
    });
    publicTestApiMocks.finishSession.mockResolvedValue({
      sessionToken: 'session-token',
      status: 'COMPLETED',
      finishedAt: '2026-05-27T00:00:02.000Z',
      analysis: {
        providerMode: 'STUB',
        status: 'READY',
        summary: null,
        errorMessage: null,
        generatedAt: '2026-05-27T00:00:02.000Z',
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('autosaves a changed answer draft after the debounce interval', async () => {
    const { result } = renderHook(() => usePublicTestRunWorkspace());

    act(() => {
      result.current.setQuestionAnswer(1, 'hello');
    });

    expect(result.current.autosaveStatus).toBe('pending');
    expect(publicTestApiMocks.saveAnswers).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });

    expect(publicTestApiMocks.saveAnswers).toHaveBeenCalledTimes(1);
    expect(publicTestApiMocks.saveAnswers).toHaveBeenCalledWith({
      sessionToken: 'session-token',
      data: {
        answers: [{ questionId: 1, answerPayload: 'hello' }],
      },
    });
    expect(result.current.autosaveStatus).toBe('saved');
  });

  it('sends only the latest answer when the draft changes during the debounce interval', async () => {
    const { result } = renderHook(() => usePublicTestRunWorkspace());

    act(() => {
      result.current.setQuestionAnswer(1, 'hel');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    act(() => {
      result.current.setQuestionAnswer(1, 'hello');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(899);
    });

    expect(publicTestApiMocks.saveAnswers).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(publicTestApiMocks.saveAnswers).toHaveBeenCalledTimes(1);
    expect(publicTestApiMocks.saveAnswers).toHaveBeenCalledWith({
      sessionToken: 'session-token',
      data: {
        answers: [{ questionId: 1, answerPayload: 'hello' }],
      },
    });
  });

  it('keeps the local draft available when autosave fails', async () => {
    publicTestApiMocks.saveAnswers.mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => usePublicTestRunWorkspace());

    act(() => {
      result.current.setQuestionAnswer(1, 'hello');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });

    expect(result.current.autosaveStatus).toBe('error');
    expect(result.current.autosaveError).toBe('Не удалось сохранить ответы');
    expect(result.current.getCurrentAnswer(1)).toBe('hello');
  });

  it('waits for an in-flight autosave before saving final answers', async () => {
    let resolveAutosave!: (value: unknown) => void;
    publicTestApiMocks.saveAnswers.mockReset();
    publicTestApiMocks.saveAnswers
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveAutosave = resolve;
          }),
      )
      .mockResolvedValueOnce({
        sessionToken: 'session-token',
        status: 'IN_PROGRESS',
        answers: [
          {
            questionId: 1,
            answerPayload: 'fresh',
            updatedAt: '2026-05-27T00:00:03.000Z',
          },
        ],
      });

    const { result } = renderHook(() => usePublicTestRunWorkspace());

    act(() => {
      result.current.setQuestionAnswer(1, 'stale');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });

    expect(publicTestApiMocks.saveAnswers).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.setQuestionAnswer(1, 'fresh');
    });
    const finishPromise = result.current.handleFinish();

    expect(publicTestApiMocks.saveAnswers).toHaveBeenCalledTimes(1);
    expect(publicTestApiMocks.finishSession).not.toHaveBeenCalled();

    await act(async () => {
      resolveAutosave({
        sessionToken: 'session-token',
        status: 'IN_PROGRESS',
        answers: [
          {
            questionId: 1,
            answerPayload: 'stale',
            updatedAt: '2026-05-27T00:00:01.000Z',
          },
        ],
      });
      await finishPromise;
    });

    expect(publicTestApiMocks.saveAnswers).toHaveBeenNthCalledWith(2, {
      sessionToken: 'session-token',
      data: {
        answers: [{ questionId: 1, answerPayload: 'fresh' }],
      },
    });
    expect(publicTestApiMocks.finishSession).toHaveBeenCalledWith({
      sessionToken: 'session-token',
    });
  });
});
