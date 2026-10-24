import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAdminTestsActions } from './use-admin-tests-actions';

import type { AdminTestsActionsState } from './use-admin-tests-actions';
import type { CreateTestValues, TestTopicListItem } from '@/features/tests';
import type { ReactNode } from 'react';

type MutateOptions<TResult> = {
  onSuccess?: (result: TResult) => void;
  onError?: (error: unknown) => void;
};

const { createMutate, importMutate, deleteMutate } = vi.hoisted(() => ({
  createMutate: vi.fn(),
  importMutate: vi.fn(),
  deleteMutate: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/shared/api/generated/tests/tests', () => {
  const idle = () => ({ mutate: vi.fn(), isPending: false });
  return {
    getTestsControllerListTopicsQueryKey: () => ['/admin/tests'],
    getTestsControllerGetTopicDraftQueryKey: (topicId: number) => [`/admin/tests/${topicId}/draft`],
    useTestsControllerCreateTopic: () => ({ mutate: createMutate, isPending: false }),
    useTestsControllerImportProfOrientationV3Plus: () => ({
      mutate: importMutate,
      isPending: false,
    }),
    useTestsControllerDeleteTopic: () => ({ mutate: deleteMutate, isPending: false }),
    useTestsControllerCreateTopicFromAi: idle,
    useTestsControllerArchiveTopic: idle,
    useTestsControllerRestoreTopic: idle,
    useTestsControllerPublishTopic: idle,
    useTestsControllerReorderQuestions: idle,
  };
});

interface UndoToastOptions {
  action: { label: string; onClick: () => void };
}

const createTopic = (overrides: Partial<TestTopicListItem> = {}): TestTopicListItem => ({
  id: 1225,
  slug: 'audit-a',
  description: null,
  draftVersionNumber: 2,
  draftTitle: 'AUDIT-A',
  draftQuestionCount: 3,
  publishedVersionNumber: 1,
  publishedTitle: 'AUDIT-A',
  activePublicLinkCount: 2,
  publicLinkCount: 2,
  attemptCount: 0,
  hasPublishedVersion: true,
  canDelete: false,
  scoringKind: 'DEFAULT',
  hasUnpublishedChanges: false,
  updatedAt: '2026-09-11T10:00:00.000Z',
  ...overrides,
});

const renderActions = (selectedTopic: TestTopicListItem | null = null) => {
  const queryClient = new QueryClient();
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
  const state = {
    topics: {
      effectiveSelectedTopicId: selectedTopic?.id ?? null,
      selectedTopic,
      topics: [],
      navigateToTopic: vi.fn(),
      navigateToList: vi.fn(),
      setListMode: vi.fn(),
    },
    draft: {
      draft: undefined,
      detail: undefined,
      isDraftDirty: false,
      clearDraftEdits: vi.fn(),
      invalidateTestsData: vi.fn(),
      draftAutosave: { resetAutosaveMeta: vi.fn() },
    },
    dialogs: {
      setIsAiGeneratorOpen: vi.fn(),
      setIsImportConfirmOpen: vi.fn(),
      setPendingArchiveTopic: vi.fn(),
      setPendingRestoreTopic: vi.fn(),
    },
    questionEditor: {},
  } as unknown as Omit<AdminTestsActionsState, 'createForm'>;

  const { result } = renderHook(
    () => {
      const createForm = useForm<CreateTestValues>({
        defaultValues: { title: '', slug: '', description: '' },
      });
      return { createForm, actions: useAdminTestsActions({ ...state, createForm }) };
    },
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    },
  );

  return { result, state, invalidateQueries };
};

describe('useAdminTestsActions', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates a test from the form, clears the form and refreshes the test lists', async () => {
    createMutate.mockImplementation((_: unknown, options: MutateOptions<{ topicId: number }>) =>
      options.onSuccess?.({ topicId: 77 }),
    );
    const { result, state, invalidateQueries } = renderActions();
    act(() => {
      result.current.createForm.setValue('title', '  Профориентация  ');
      result.current.createForm.setValue('description', 'Для 9 классов');
    });

    await act(() => result.current.actions.handleCreateTest());

    expect(createMutate.mock.calls[0]?.[0]).toEqual({
      data: { title: 'Профориентация', slug: undefined, description: 'Для 9 классов' },
    });
    expect(result.current.createForm.getValues()).toEqual({
      title: '',
      slug: '',
      description: '',
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['/admin/tests'] });
    expect(state.topics.navigateToTopic).toHaveBeenCalledWith(77);
  });

  it('refuses to create a test without a title', async () => {
    const { result } = renderActions();

    await act(() => result.current.actions.handleCreateTest());

    expect(createMutate).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Укажите название теста');
  });

  /**
   * Находка аудита FLOW-03: лишний импорт убирался только через архив в четыре шага. Черновик после
   * импорта ни разу не публиковался, поэтому его можно удалить прямо из тоста.
   */
  it('opens the imported draft and offers to undo the import from the toast', () => {
    importMutate.mockImplementation((_: undefined, options: MutateOptions<{ topicId: number }>) =>
      options.onSuccess?.({ topicId: 1300 }),
    );
    const { result, state } = renderActions();

    act(() => result.current.actions.handleImportProfOrientationV3Plus());

    expect(state.dialogs.setIsImportConfirmOpen).toHaveBeenCalledWith(false);
    expect(state.topics.navigateToTopic).toHaveBeenCalledWith(1300);
    const [message, options] = vi.mocked(toast.success).mock.calls[0] as [string, UndoToastOptions];
    expect(message).toBe('Методика v3+ импортирована');
    expect(options.action.label).toBe('Отменить');
  });

  it('deletes the imported draft and returns to the list when the import is undone', () => {
    importMutate.mockImplementation((_: undefined, options: MutateOptions<{ topicId: number }>) =>
      options.onSuccess?.({ topicId: 1300 }),
    );
    deleteMutate.mockImplementation((_: unknown, options: MutateOptions<unknown>) =>
      options.onSuccess?.(undefined),
    );
    const { result, state } = renderActions();

    act(() => result.current.actions.handleImportProfOrientationV3Plus());
    const [, options] = vi.mocked(toast.success).mock.calls[0] as [string, UndoToastOptions];
    act(() => options.action.onClick());

    expect(deleteMutate.mock.calls[0]?.[0]).toEqual({ topicId: 1300 });
    expect(state.topics.navigateToList).toHaveBeenCalledTimes(1);
    expect(vi.mocked(toast.success).mock.calls[1]?.[0]).toBe('Импорт отменен');
  });

  it('asks for confirmation instead of archiving the test straight away', () => {
    const selectedTopic = createTopic();
    const { result, state } = renderActions(selectedTopic);

    act(() => result.current.actions.handleToggleTopicActive(false));

    expect(state.dialogs.setPendingArchiveTopic).toHaveBeenCalledWith(selectedTopic);
    expect(state.dialogs.setPendingRestoreTopic).not.toHaveBeenCalled();
  });

  it('asks for confirmation before restoring the test from the archive', () => {
    const selectedTopic = createTopic();
    const { result, state } = renderActions(selectedTopic);

    act(() => result.current.actions.handleToggleTopicActive(true));

    expect(state.dialogs.setPendingRestoreTopic).toHaveBeenCalledWith(selectedTopic);
    expect(state.dialogs.setPendingArchiveTopic).not.toHaveBeenCalled();
  });

  it('does nothing while the selected test is still loading', () => {
    const { result, state } = renderActions(null);

    act(() => result.current.actions.handleToggleTopicActive(false));

    expect(state.dialogs.setPendingArchiveTopic).not.toHaveBeenCalled();
    expect(state.dialogs.setPendingRestoreTopic).not.toHaveBeenCalled();
  });
});
