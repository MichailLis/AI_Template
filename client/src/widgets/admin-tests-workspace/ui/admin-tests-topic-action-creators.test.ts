import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createHandleImportProfOrientationV3Plus } from './admin-tests-topic-action-creators';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

type MutateOptions<TResult> = {
  onSuccess?: (result: TResult) => void;
  onError?: (error: unknown) => void;
};

interface UndoToastOptions {
  action: { label: string; onClick: () => void };
}

const createDeps = () => {
  const importMutate = vi.fn((_: undefined, options: MutateOptions<{ topicId: number }>) => {
    options.onSuccess?.({ topicId: 1300 });
  });
  const deleteMutate = vi.fn((_: { topicId: number }, options: MutateOptions<unknown>) => {
    options.onSuccess?.({ topicId: 1300 });
  });

  return {
    importMutate,
    deleteMutate,
    deps: {
      importProfOrientationV3PlusMutation: { mutate: importMutate },
      deleteTopicMutation: { mutate: deleteMutate },
      setIsImportConfirmOpen: vi.fn(),
      draftAutosave: { resetAutosaveMeta: vi.fn() },
      refetchTestsData: vi.fn(),
      navigateToTopic: vi.fn(),
      navigateToList: vi.fn(),
    },
  };
};

/**
 * Находка аудита FLOW-03: лишний импорт убирался только через архив в четыре шага. Черновик после
 * импорта ни разу не публиковался, поэтому его можно удалить прямо из тоста.
 */
describe('createHandleImportProfOrientationV3Plus', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('opens the imported draft and offers to undo the import from the toast', () => {
    const { deps } = createDeps();

    createHandleImportProfOrientationV3Plus(deps)();

    expect(deps.setIsImportConfirmOpen).toHaveBeenCalledWith(false);
    expect(deps.navigateToTopic).toHaveBeenCalledWith(1300);
    const [message, options] = vi.mocked(toast.success).mock.calls[0] as [string, UndoToastOptions];
    expect(message).toBe('Методика v3+ импортирована');
    expect(options.action.label).toBe('Отменить');
  });

  it('deletes the imported draft and returns to the list when the import is undone', () => {
    const { deps, deleteMutate } = createDeps();

    createHandleImportProfOrientationV3Plus(deps)();
    const [, options] = vi.mocked(toast.success).mock.calls[0] as [string, UndoToastOptions];
    options.action.onClick();

    expect(deleteMutate.mock.calls[0]?.[0]).toEqual({ topicId: 1300 });
    expect(deps.navigateToList).toHaveBeenCalledTimes(1);
    expect(vi.mocked(toast.success).mock.calls[1]?.[0]).toBe('Импорт отменен');
  });
});
