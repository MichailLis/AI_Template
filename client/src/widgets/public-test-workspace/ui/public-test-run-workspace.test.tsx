import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PublicTestRunWorkspace } from './public-test-run-workspace';

import type { PublicTestAutosaveStatus, PublicTestSession } from './public-test-run.types';

const publicRunMocks = vi.hoisted(() => ({
  useWorkspace: vi.fn(),
}));

vi.mock('./use-public-test-run-workspace', () => ({
  usePublicTestRunWorkspace: publicRunMocks.useWorkspace,
}));

const createSession = (publicTemplate: PublicTestSession['publicTemplate']): PublicTestSession => ({
  sessionToken: 'session-token',
  shortCode: 'DEMO2026',
  publicTemplate,
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
      type: 'SINGLE_CHOICE',
      title: 'Question 1',
      description: null,
      required: true,
      order: 1,
      settings: null,
      options: [
        { id: 1, label: 'Answer A', value: 'a', order: 1 },
        { id: 2, label: 'Answer B', value: 'b', order: 2 },
      ],
      sliderBands: [],
    },
  ],
  answers: [],
  serverTime: '2026-05-27T00:00:00.000Z',
});

const renderWorkspace = () =>
  render(
    <MemoryRouter>
      <PublicTestRunWorkspace />
    </MemoryRouter>,
  );

const mockWorkspace = (
  publicTemplate: PublicTestSession['publicTemplate'],
  autosaveStatus: PublicTestAutosaveStatus,
  sessionOverrides: Partial<PublicTestSession> = {},
  queryOverrides: Record<string, unknown> = {},
) => {
  const refetch = vi.fn().mockResolvedValue({});
  publicRunMocks.useWorkspace.mockReturnValue({
    code: 'DEMO2026',
    sessionToken: 'session-token',
    sessionQuery: { isLoading: false, isError: false, refetch, ...queryOverrides },
    saveAnswersMutation: { isPending: false },
    finishMutation: { isPending: false },
    session: { ...createSession(publicTemplate), ...sessionOverrides },
    totalQuestionsCount: 1,
    getCurrentAnswer: () => undefined,
    setQuestionAnswer: vi.fn(),
    handleFinish: vi.fn(),
    autosaveStatus,
    autosaveError: null,
  });
  return { refetch };
};

describe('PublicTestRunWorkspace', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('does not show autosave badges in the standard student run screen', () => {
    mockWorkspace('STANDARD', 'pending');

    render(<PublicTestRunWorkspace />);

    expect(screen.getByRole('heading', { name: 'Question 1' })).toBeInTheDocument();
    expect(screen.queryByText('Есть изменения')).not.toBeInTheDocument();
    expect(screen.queryByText('Сохранено')).not.toBeInTheDocument();
  });

  it('does not show autosave badges in the Polus student run screen', () => {
    mockWorkspace('POLUS', 'saved');

    render(<PublicTestRunWorkspace />);

    expect(screen.getByRole('heading', { name: 'Question 1' })).toBeInTheDocument();
    expect(screen.queryByText('Есть изменения')).not.toBeInTheDocument();
    expect(screen.queryByText('Сохранено')).not.toBeInTheDocument();
  });
});

/**
 * Находка доаудита FLOW-09: лимит времени ученику не показывался, а после его истечения экран
 * продолжал принимать ответы, которые сервер уже не сохранял.
 */
describe.each(['STANDARD', 'POLUS'] as const)(
  'PublicTestRunWorkspace time limit (%s)',
  (template) => {
    const startedAt = Date.parse('2026-09-13T10:00:00.000Z');
    const timedSession = (
      overrides: Partial<PublicTestSession> = {},
      queryOverrides: Record<string, unknown> = {},
    ) =>
      mockWorkspace(
        template,
        'idle',
        {
          timeLimitMinutes: 5,
          expiresAt: '2026-09-13T10:05:00.000Z',
          serverTime: new Date(startedAt + 55_000).toISOString(),
          ...overrides,
        },
        queryOverrides,
      );

    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: false });
      vi.setSystemTime(startedAt + 55_000);
    });

    afterEach(() => {
      cleanup();
      vi.clearAllMocks();
      vi.useRealTimers();
    });

    it('shows the remaining time while the attempt is running', () => {
      timedSession({});

      renderWorkspace();

      expect(screen.getByRole('timer')).toHaveTextContent('4:05');
      expect(screen.queryByText(/меньше минуты/i)).not.toBeInTheDocument();
    });

    it('warns during the last minute', () => {
      vi.setSystemTime(startedAt + 4 * 60_000 + 30_000);
      timedSession({
        serverTime: new Date(startedAt + 4 * 60_000 + 30_000).toISOString(),
      });

      renderWorkspace();

      expect(screen.getByRole('timer')).toHaveTextContent('0:30');
      expect(screen.getByRole('status')).toHaveTextContent(/меньше минуты/i);
    });

    it('calibrates remaining time by serverTime when client clock is ahead', () => {
      vi.setSystemTime(startedAt + 3 * 60_000);
      timedSession({
        serverTime: new Date(startedAt + 60_000).toISOString(),
      });

      renderWorkspace();

      expect(screen.getByRole('timer')).toHaveTextContent('4:00');
    });

    it('triggers refetch and keeps questions visible when local clock runs out while server is in progress', () => {
      vi.setSystemTime(startedAt + 4 * 60_000 + 58_000);
      const { refetch } = timedSession({
        serverTime: new Date(startedAt + 4 * 60_000 + 58_000).toISOString(),
      });

      renderWorkspace();
      expect(screen.getByRole('heading', { name: 'Question 1' })).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(3_000);
      });

      expect(screen.getByRole('heading', { name: 'Question 1' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Время вышло' })).not.toBeInTheDocument();
      expect(refetch).toHaveBeenCalled();
    });

    it('shows the expired state from the server instead of the questions', () => {
      timedSession({ status: 'EXPIRED' });

      renderWorkspace();

      expect(screen.getByRole('heading', { name: 'Время вышло' })).toBeInTheDocument();
      expect(screen.getByText(/5 минут/)).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Question 1' })).not.toBeInTheDocument();
      expect(screen.queryByRole('timer')).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Вернуться к началу теста' })).toHaveAttribute(
        'href',
        '/t/DEMO2026',
      );
    });

    it('shows no clock for an attempt without a time limit', () => {
      mockWorkspace(template, 'idle');

      renderWorkspace();

      expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    });
  },
);

/**
 * Находка доаудита FLOW-08: завершенная попытка открывалась как незавершенная и принимала несохраняемые ответы.
 * Для COMPLETED должен происходить переход на результат (/t/:code/result/:sessionToken).
 * Для ABANDONED должен показываться экран закрытой попытки со ссылкой на начало теста.
 */
describe.each(['STANDARD', 'POLUS'] as const)(
  'PublicTestRunWorkspace terminal session states (%s)',
  (template) => {
    afterEach(() => {
      cleanup();
      vi.clearAllMocks();
    });

    it('redirects completed attempts to the result screen', () => {
      mockWorkspace(template, 'idle', { status: 'COMPLETED' });

      render(
        <MemoryRouter initialEntries={['/t/DEMO2026/session/session-token']}>
          <Routes>
            <Route path="/t/:code/session/:sessionToken" element={<PublicTestRunWorkspace />} />
            <Route path="/t/:code/result/:sessionToken" element={<div>Result Screen Target</div>} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText('Result Screen Target')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Question 1' })).not.toBeInTheDocument();
    });

    it('shows the closed state for abandoned attempts instead of questions', () => {
      mockWorkspace(template, 'idle', { status: 'ABANDONED' });

      renderWorkspace();

      expect(screen.getByRole('heading', { name: 'Попытка закрыта' })).toBeInTheDocument();
      expect(screen.getByText(/Эта попытка была прервана или закрыта/i)).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Question 1' })).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Вернуться к началу теста' })).toHaveAttribute(
        'href',
        '/t/DEMO2026',
      );
    });
  },
);
