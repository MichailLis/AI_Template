import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
});

const mockWorkspace = (
  publicTemplate: PublicTestSession['publicTemplate'],
  autosaveStatus: PublicTestAutosaveStatus,
) => {
  publicRunMocks.useWorkspace.mockReturnValue({
    code: 'DEMO2026',
    sessionToken: 'session-token',
    sessionQuery: { isLoading: false, isError: false },
    saveAnswersMutation: { isPending: false },
    finishMutation: { isPending: false },
    session: createSession(publicTemplate),
    totalQuestionsCount: 1,
    getCurrentAnswer: () => undefined,
    setQuestionAnswer: vi.fn(),
    handleFinish: vi.fn(),
    autosaveStatus,
    autosaveError: null,
  });
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
