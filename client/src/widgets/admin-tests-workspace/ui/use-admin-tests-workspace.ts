import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
  hasDraftEdits,
  parseApiError,
  useDraftAutosave,
  useQuestionEditor,
  type TestTopicListItem,
} from '@/features/tests';
import {
  useTestsControllerArchiveTopic,
  useTestsControllerCreateTopic,
  useTestsControllerCreateTopicFromAi,
  useTestsControllerDeleteTopic,
  useTestsControllerGetTopicDraft,
  useTestsControllerListTopics,
  useTestsControllerPublishTopic,
  useTestsControllerReorderQuestions,
  useTestsControllerRestoreTopic,
} from '@/shared/api/generated/tests/tests';

import { useAdminTestsWorkspaceActions } from './use-admin-tests-workspace-actions';

export type ListMode = 'active' | 'archived';

export function useAdminTestsWorkspace() {
  const { topicId: topicIdParam } = useParams<{ topicId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTopicsQuery = useTestsControllerListTopics();
  const archivedTopicsQuery = useTestsControllerListTopics({ archived: true });
  const createTopicMutation = useTestsControllerCreateTopic();
  const createTopicFromAiMutation = useTestsControllerCreateTopicFromAi();
  const deleteTopicMutation = useTestsControllerDeleteTopic();
  const archiveTopicMutation = useTestsControllerArchiveTopic();
  const restoreTopicMutation = useTestsControllerRestoreTopic();
  const reorderQuestionsMutation = useTestsControllerReorderQuestions();
  const publishMutation = useTestsControllerPublishTopic();

  const [draftEdits, setDraftEdits] = useState<
    Record<number, { title: string; description: string }>
  >({});

  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestSlug, setNewTestSlug] = useState('');
  const [newTestDescription, setNewTestDescription] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);

  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [pendingDeleteTopic, setPendingDeleteTopic] = useState<TestTopicListItem | null>(null);

  const [pendingTopicSwitchId, setPendingTopicSwitchId] = useState<number | null>(null);
  const [isSwitchConfirmOpen, setIsSwitchConfirmOpen] = useState(false);

  const [isNavigationConfirmOpen, setIsNavigationConfirmOpen] = useState(false);
  const [pendingNavigationPath, setPendingNavigationPath] = useState<string | null>(null);

  const [listMode, setListMode] = useState<ListMode>('active');
  const [pendingArchiveTopic, setPendingArchiveTopic] = useState<TestTopicListItem | null>(null);
  const [pendingRestoreTopic, setPendingRestoreTopic] = useState<TestTopicListItem | null>(null);

  const topicsQuery = useMemo(
    () => (listMode === 'active' ? activeTopicsQuery : archivedTopicsQuery),
    [activeTopicsQuery, archivedTopicsQuery, listMode],
  );

  const topics = useMemo(() => topicsQuery.data?.topics ?? [], [topicsQuery.data?.topics]);
  const archivedTopics = useMemo(
    () => archivedTopicsQuery.data?.topics ?? [],
    [archivedTopicsQuery.data?.topics],
  );

  const routeSelectedTopicId = useMemo(() => {
    if (!topicIdParam) {
      return null;
    }

    const parsedTopicId = Number(topicIdParam);
    if (!Number.isInteger(parsedTopicId) || parsedTopicId <= 0) {
      return null;
    }

    return parsedTopicId;
  }, [topicIdParam]);

  const effectiveSelectedTopicId = useMemo(() => {
    if (location.pathname === '/admin/tests') {
      return null;
    }

    return routeSelectedTopicId;
  }, [location.pathname, routeSelectedTopicId]);

  const navigateToTopic = useCallback(
    (topicId: number) => {
      navigate(`/admin/tests/${topicId}`);
    },
    [navigate],
  );

  const detailQuery = useTestsControllerGetTopicDraft(effectiveSelectedTopicId ?? 0, {
    query: {
      enabled: Boolean(effectiveSelectedTopicId),
    },
  });

  const detail = detailQuery.data;
  const draft = detail?.draft;
  const topicsErrorMessage = topicsQuery.isError ? parseApiError(topicsQuery.error) : null;
  const detailErrorMessage = detailQuery.isError ? parseApiError(detailQuery.error) : null;

  const isSelectedTopicArchived = useMemo(() => {
    if (!effectiveSelectedTopicId) {
      return false;
    }

    return archivedTopics.some((topic) => topic.id === effectiveSelectedTopicId);
  }, [archivedTopics, effectiveSelectedTopicId]);

  const draftForm = useMemo(() => {
    if (!draft) {
      return { id: 0, title: '', description: '' };
    }

    const edited = draftEdits[draft.id];
    return {
      id: draft.id,
      title: edited?.title ?? draft.title,
      description: edited?.description ?? draft.description ?? '',
    };
  }, [draft, draftEdits]);

  const clearDraftEdits = useCallback((draftId: number) => {
    setDraftEdits((previous) => {
      const next = { ...previous };
      delete next[draftId];
      return next;
    });
  }, []);

  const isDraftDirty = draft ? hasDraftEdits(draft, draftForm.title, draftForm.description) : false;
  const canPublish = Boolean(detail && !isDraftDirty && detail.draft.questions.length > 0);

  const refetchTopicsOnly = useCallback(() => {
    void Promise.all([activeTopicsQuery.refetch(), archivedTopicsQuery.refetch()]);
  }, [activeTopicsQuery, archivedTopicsQuery]);

  const refetchTestsData = useCallback(() => {
    void Promise.all([
      activeTopicsQuery.refetch(),
      archivedTopicsQuery.refetch(),
      detailQuery.refetch(),
    ]);
  }, [activeTopicsQuery, archivedTopicsQuery, detailQuery]);

  const draftAutosave = useDraftAutosave({
    topicId: effectiveSelectedTopicId,
    draft,
    draftForm,
    isDraftDirty,
    publishIsPending: publishMutation.isPending,
    clearDraftEdits,
    onAfterSave: refetchTestsData,
  });

  const questionEditor = useQuestionEditor({
    topicId: effectiveSelectedTopicId,
    onDataChanged: refetchTestsData,
  });

  const discardCurrentDraftEditsAndResetAutosave = useCallback(() => {
    if (draft) {
      clearDraftEdits(draft.id);
    }

    draftAutosave.resetAutosaveMeta();
  }, [clearDraftEdits, draft, draftAutosave]);

  const handleAttemptNavigation = useCallback(
    (targetPath: string) => {
      if (isDraftDirty) {
        setPendingNavigationPath(targetPath);
        setIsNavigationConfirmOpen(true);
        return false;
      }

      return true;
    },
    [isDraftDirty],
  );

  const handleConfirmNavigationLeave = useCallback(() => {
    discardCurrentDraftEditsAndResetAutosave();
    setIsNavigationConfirmOpen(false);
    setPendingNavigationPath(null);
  }, [discardCurrentDraftEditsAndResetAutosave]);

  const handleConfirmNavigationStay = useCallback(() => {
    setIsNavigationConfirmOpen(false);
    setPendingNavigationPath(null);
  }, []);

  const updateCurrentDraftEdits = (patch: Partial<{ title: string; description: string }>) => {
    if (!draft) {
      return;
    }

    setDraftEdits((previous) => ({
      ...previous,
      [draft.id]: {
        title: patch.title ?? previous[draft.id]?.title ?? draft.title,
        description:
          patch.description ?? previous[draft.id]?.description ?? draft.description ?? '',
      },
    }));
  };

  const handleToggleTopicActive = useCallback(
    (nextActive: boolean) => {
      if (!effectiveSelectedTopicId) {
        return;
      }

      const mutation = nextActive ? restoreTopicMutation : archiveTopicMutation;
      mutation.mutate(
        { topicId: effectiveSelectedTopicId },
        {
          onSuccess: () => {
            setListMode(nextActive ? 'active' : 'archived');
            refetchTestsData();
          },
        },
      );
    },
    [archiveTopicMutation, effectiveSelectedTopicId, refetchTestsData, restoreTopicMutation],
  );

  const {
    handleCreateTest,
    handleCreateTestFromAi,
    handleSelectTest,
    handleConfirmTopicSwitch,
    handleConfirmDeleteTopic,
    handleConfirmPublish,
    handleReorderQuestions,
    handleConfirmArchiveTopic,
    handleConfirmRestoreTopic,
    autosaveHint,
  } = useAdminTestsWorkspaceActions({
    newTestTitle,
    newTestSlug,
    newTestDescription,
    setNewTestTitle,
    setNewTestSlug,
    setNewTestDescription,
    setIsAiGeneratorOpen,
    createTopicMutation,
    createTopicFromAiMutation,
    deleteTopicMutation,
    reorderQuestionsMutation,
    publishMutation,
    draftAutosave,
    refetchTopicsOnly,
    refetchTestsData,
    effectiveSelectedTopicId,
    isDraftDirty,
    setPendingTopicSwitchId,
    setIsSwitchConfirmOpen,
    pendingTopicSwitchId,
    draft,
    clearDraftEdits,
    pendingDeleteTopic,
    setPendingDeleteTopic,
    topics,
    questionEditor,
    setIsPublishConfirmOpen,
    detail,
    refetchDetailOnly: () => {
      void detailQuery.refetch();
    },
    pendingArchiveTopic,
    setPendingArchiveTopic,
    pendingRestoreTopic,
    setPendingRestoreTopic,
    archiveTopicMutation,
    restoreTopicMutation,
    setListMode,
    navigateToTopic,
  });

  return {
    topics,
    topicsQuery,
    topicsErrorMessage,
    detail,
    detailQuery,
    detailErrorMessage,
    draftForm,
    isDraftDirty,
    canPublish,
    draftAutosave,
    questionEditor,
    autosaveHint,
    effectiveSelectedTopicId,
    newTestTitle,
    newTestSlug,
    newTestDescription,
    testSearch,
    isAiGeneratorOpen,
    isPublishConfirmOpen,
    pendingDeleteTopic,
    pendingTopicSwitchId,
    isSwitchConfirmOpen,
    createTopicMutation,
    createTopicFromAiMutation,
    deleteTopicMutation,
    reorderQuestionsMutation,
    publishMutation,
    setTestSearch,
    setNewTestTitle,
    setNewTestSlug,
    setNewTestDescription,
    setIsAiGeneratorOpen,
    setPendingDeleteTopic,
    setPendingTopicSwitchId,
    setIsSwitchConfirmOpen,
    setIsPublishConfirmOpen,
    updateCurrentDraftEdits,
    discardCurrentDraftEditsAndResetAutosave,
    handleAttemptNavigation,
    handleConfirmNavigationLeave,
    handleConfirmNavigationStay,
    handleCreateTest,
    handleCreateTestFromAi,
    handleSelectTest,
    handleConfirmTopicSwitch,
    handleConfirmDeleteTopic,
    handleConfirmPublish,
    handleReorderQuestions,
    handleConfirmArchiveTopic,
    handleConfirmRestoreTopic,
    handleToggleTopicActive,
    listMode,
    setListMode,
    pendingArchiveTopic,
    pendingRestoreTopic,
    isSelectedTopicArchived,
    archiveTopicMutation,
    restoreTopicMutation,
    setPendingArchiveTopic,
    setPendingRestoreTopic,
    isNavigationConfirmOpen,
    setIsNavigationConfirmOpen,
    pendingNavigationPath,
    setPendingNavigationPath,
  };
}
