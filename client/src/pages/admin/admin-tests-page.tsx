import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  useTestsControllerCreateTopic,
  useTestsControllerCreateTopicFromAi,
  useTestsControllerDeleteTopic,
  useTestsControllerGetTopicDraft,
  useTestsControllerListTopics,
  useTestsControllerPublishTopic,
  useTestsControllerReorderQuestions,
} from '@/shared/api/generated/tests/tests';

import { AiTestGeneratorModal } from './tests/ai-test-generator-modal';
import { ConfirmActionDialog } from './tests/confirm-action-dialog';
import { QuestionModal } from './tests/question-modal';
import { TestEditor } from './tests/test-editor';
import { TestsSidebar } from './tests/tests-sidebar';
import { useDraftAutosave } from './tests/use-draft-autosave';
import { useQuestionEditor } from './tests/use-question-editor';
import { hasDraftEdits, parseApiError } from './tests/utils';

import type { TestTopicListItem } from './tests/types';
import type { CreateTestsTopicFromAiDto } from '@/shared/api/model';

export default function AdminTestsPage() {
  const topicsQuery = useTestsControllerListTopics();
  const createTopicMutation = useTestsControllerCreateTopic();
  const createTopicFromAiMutation = useTestsControllerCreateTopicFromAi();
  const deleteTopicMutation = useTestsControllerDeleteTopic();
  const reorderQuestionsMutation = useTestsControllerReorderQuestions();
  const publishMutation = useTestsControllerPublishTopic();

  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
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

  const topics = useMemo(() => topicsQuery.data?.topics ?? [], [topicsQuery.data?.topics]);

  const effectiveSelectedTopicId = useMemo(() => {
    if (topics.length === 0) {
      return null;
    }

    if (selectedTopicId && topics.some((topic) => topic.id === selectedTopicId)) {
      return selectedTopicId;
    }

    return topics[0].id;
  }, [selectedTopicId, topics]);

  const detailQuery = useTestsControllerGetTopicDraft(effectiveSelectedTopicId ?? 0, {
    query: {
      enabled: Boolean(effectiveSelectedTopicId),
    },
  });

  const detail = detailQuery.data;
  const draft = detail?.draft;
  const topicsErrorMessage = topicsQuery.isError ? parseApiError(topicsQuery.error) : null;
  const detailErrorMessage = detailQuery.isError ? parseApiError(detailQuery.error) : null;

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

  const refetchTestsData = useCallback(() => {
    void Promise.all([topicsQuery.refetch(), detailQuery.refetch()]);
  }, [detailQuery, topicsQuery]);

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

  const handleCreateTest = () => {
    if (!newTestTitle.trim()) {
      toast.error('Укажите название теста');
      return;
    }

    createTopicMutation.mutate(
      {
        data: {
          title: newTestTitle.trim(),
          slug: newTestSlug.trim() || undefined,
          description: newTestDescription.trim() || null,
        },
      },
      {
        onSuccess: (topic) => {
          toast.success('Тест создан');
          setNewTestTitle('');
          setNewTestSlug('');
          setNewTestDescription('');
          draftAutosave.resetAutosaveMeta();
          setSelectedTopicId(topic.topicId);
          void topicsQuery.refetch();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleCreateTestFromAi = (payload: CreateTestsTopicFromAiDto) => {
    createTopicFromAiMutation.mutate(
      {
        data: payload,
      },
      {
        onSuccess: (topic) => {
          toast.success('Тест успешно создан с помощью ИИ');
          setIsAiGeneratorOpen(false);
          draftAutosave.resetAutosaveMeta();
          setSelectedTopicId(topic.topicId);
          refetchTestsData();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleSelectTest = (topicId: number) => {
    if (topicId === effectiveSelectedTopicId) {
      return;
    }

    if (isDraftDirty) {
      setPendingTopicSwitchId(topicId);
      setIsSwitchConfirmOpen(true);
      return;
    }

    draftAutosave.resetAutosaveMeta();
    setSelectedTopicId(topicId);
  };

  const handleConfirmTopicSwitch = () => {
    if (pendingTopicSwitchId === null) {
      setIsSwitchConfirmOpen(false);
      return;
    }

    if (draft) {
      clearDraftEdits(draft.id);
    }

    draftAutosave.resetAutosaveMeta();
    setSelectedTopicId(pendingTopicSwitchId);
    setPendingTopicSwitchId(null);
    setIsSwitchConfirmOpen(false);
  };

  const handleConfirmDeleteTopic = () => {
    if (!pendingDeleteTopic) {
      return;
    }

    const topicIdToDelete = pendingDeleteTopic.id;

    deleteTopicMutation.mutate(
      {
        topicId: topicIdToDelete,
      },
      {
        onSuccess: () => {
          toast.success('Тест удален');

          if (effectiveSelectedTopicId === topicIdToDelete) {
            if (draft) {
              clearDraftEdits(draft.id);
            }

            const nextTopic = topics.find((topic) => topic.id !== topicIdToDelete);
            setSelectedTopicId(nextTopic?.id ?? null);
            questionEditor.closeQuestionModalDirect();
            questionEditor.setPendingDeleteQuestion(null);
            setIsPublishConfirmOpen(false);
            setPendingTopicSwitchId(null);
            setIsSwitchConfirmOpen(false);
          }

          setPendingDeleteTopic(null);
          draftAutosave.resetAutosaveMeta();
          refetchTestsData();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleConfirmPublish = () => {
    if (!effectiveSelectedTopicId) {
      setIsPublishConfirmOpen(false);
      return;
    }

    publishMutation.mutate(
      {
        topicId: effectiveSelectedTopicId,
      },
      {
        onSuccess: (result) => {
          toast.success(
            `Опубликована версия v${result.publishedVersionNumber}. Создана новая версия в работе v${result.newDraftVersionNumber}`,
          );
          setIsPublishConfirmOpen(false);
          questionEditor.closeQuestionModalDirect();

          if (draft) {
            clearDraftEdits(draft.id);
          }

          draftAutosave.resetAutosaveMeta();
          refetchTestsData();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleReorderQuestions = (questionIds: number[]) => {
    if (!effectiveSelectedTopicId || !detail || reorderQuestionsMutation.isPending) {
      return;
    }

    const currentIds = detail.draft.questions.map((question) => question.id);
    if (JSON.stringify(currentIds) === JSON.stringify(questionIds)) {
      return;
    }

    const currentIdSet = new Set(currentIds);
    const nextIdSet = new Set(questionIds);
    const hasInvalidPayload =
      nextIdSet.size !== questionIds.length ||
      questionIds.length !== currentIds.length ||
      questionIds.some((id) => !currentIdSet.has(id));

    if (hasInvalidPayload) {
      toast.error('Не удалось изменить порядок: список вопросов устарел. Обновите страницу теста.');
      void detailQuery.refetch();
      return;
    }

    reorderQuestionsMutation.mutate(
      {
        topicId: effectiveSelectedTopicId,
        data: {
          questionIds,
        },
      },
      {
        onSuccess: () => {
          toast.success('Порядок вопросов обновлен');
          refetchTestsData();
        },
        onError: (error) => {
          const message = parseApiError(error);
          const normalizedMessage = message.toLowerCase();

          if (
            normalizedMessage.includes('numeric string is expected') ||
            normalizedMessage.includes('questionid') ||
            normalizedMessage.includes('validation failed')
          ) {
            toast.error(
              'Ошибка маршрута reorder на backend. Перезапустите сервер и обновите страницу.',
            );
          } else {
            toast.error(`Не удалось изменить порядок: ${message}`);
          }

          refetchTestsData();
        },
      },
    );
  };

  const autosaveHint = draftAutosave.isAutoSavingDraft
    ? 'Автосохранение...'
    : draftAutosave.lastAutoSavedAt
      ? `Автосохранено в ${draftAutosave.lastAutoSavedAt}`
      : null;

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <TestsSidebar
          topics={topics}
          selectedTopicId={effectiveSelectedTopicId}
          topicsLoading={topicsQuery.isLoading}
          topicsError={topicsQuery.isError}
          topicsErrorMessage={topicsErrorMessage}
          searchValue={testSearch}
          onSearchChange={setTestSearch}
          newTestTitle={newTestTitle}
          newTestSlug={newTestSlug}
          newTestDescription={newTestDescription}
          isCreating={createTopicMutation.isPending}
          isCreatingWithAi={createTopicFromAiMutation.isPending}
          isDeletingTopic={deleteTopicMutation.isPending}
          deletingTopicId={pendingDeleteTopic?.id ?? null}
          onNewTestTitleChange={setNewTestTitle}
          onNewTestSlugChange={setNewTestSlug}
          onNewTestDescriptionChange={setNewTestDescription}
          onCreateTest={handleCreateTest}
          onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
          onRequestDeleteTest={setPendingDeleteTopic}
          onSelectTest={handleSelectTest}
          onRetryTopics={() => {
            void topicsQuery.refetch();
          }}
        />

        <TestEditor
          hasSelection={Boolean(effectiveSelectedTopicId)}
          loading={detailQuery.isLoading}
          error={detailQuery.isError}
          errorMessage={detailErrorMessage}
          detail={detail}
          draftTitle={draftForm.title}
          draftDescription={draftForm.description}
          draftDirty={isDraftDirty}
          canPublish={canPublish}
          isSavingDraft={draftAutosave.isSavingDraft}
          isPublishing={publishMutation.isPending}
          isReorderingQuestions={reorderQuestionsMutation.isPending}
          isDeletingQuestion={questionEditor.isDeletingQuestion}
          autosaveHint={autosaveHint}
          autosaveError={draftAutosave.autoSaveError}
          onDraftTitleChange={(value) => updateCurrentDraftEdits({ title: value })}
          onDraftDescriptionChange={(value) => updateCurrentDraftEdits({ description: value })}
          onSaveDraft={() => draftAutosave.saveDraft('manual')}
          onRequestPublish={() => setIsPublishConfirmOpen(true)}
          onCreateQuestion={questionEditor.openCreateQuestionModal}
          onEditQuestion={questionEditor.openEditQuestionModal}
          onRequestDeleteQuestion={questionEditor.setPendingDeleteQuestion}
          onReorderQuestions={handleReorderQuestions}
          onRetryLoad={() => {
            void detailQuery.refetch();
          }}
        />
      </div>

      <AiTestGeneratorModal
        open={isAiGeneratorOpen}
        isCreating={createTopicFromAiMutation.isPending}
        onOpenChange={setIsAiGeneratorOpen}
        onCreate={handleCreateTestFromAi}
      />

      <QuestionModal
        open={questionEditor.isQuestionModalOpen}
        mode={questionEditor.editingQuestionId ? 'edit' : 'create'}
        form={questionEditor.questionForm}
        submitError={questionEditor.questionSubmitError}
        isSubmitting={questionEditor.isQuestionSubmitting}
        onSubmit={questionEditor.handleSubmitQuestion}
        onRequestClose={questionEditor.handleQuestionModalRequestClose}
        onFormChange={questionEditor.handleQuestionFormChange}
      />

      <ConfirmActionDialog
        open={isSwitchConfirmOpen}
        title="Переключить тест без сохранения?"
        description="У текущего теста есть несохраненные изменения. Они будут потеряны при переключении."
        confirmLabel="Переключить без сохранения"
        variant="destructive"
        onConfirm={handleConfirmTopicSwitch}
        onClose={() => {
          setIsSwitchConfirmOpen(false);
          setPendingTopicSwitchId(null);
        }}
      />

      <ConfirmActionDialog
        open={questionEditor.isDiscardQuestionConfirmOpen}
        title="Закрыть редактор вопроса?"
        description="Есть несохраненные изменения в вопросе. Они будут потеряны."
        confirmLabel="Закрыть без сохранения"
        variant="destructive"
        onConfirm={questionEditor.closeQuestionModalDirect}
        onClose={() => questionEditor.setIsDiscardQuestionConfirmOpen(false)}
      />

      <ConfirmActionDialog
        open={Boolean(pendingDeleteTopic)}
        title="Удалить тест?"
        description={
          pendingDeleteTopic
            ? `Тест "${pendingDeleteTopic.draftTitle}" будет удален вместе с черновиком и опубликованными версиями.`
            : 'Тест будет удален вместе с черновиком и опубликованными версиями.'
        }
        confirmLabel="Удалить тест"
        variant="destructive"
        isConfirming={deleteTopicMutation.isPending}
        onConfirm={handleConfirmDeleteTopic}
        onClose={() => setPendingDeleteTopic(null)}
      />

      <ConfirmActionDialog
        open={Boolean(questionEditor.pendingDeleteQuestion)}
        title="Удалить вопрос?"
        description={
          questionEditor.pendingDeleteQuestion
            ? `Вопрос "${questionEditor.pendingDeleteQuestion.title}" будет удален из версии в работе.`
            : 'Вопрос будет удален из версии в работе.'
        }
        confirmLabel="Удалить вопрос"
        variant="destructive"
        isConfirming={questionEditor.isDeletingQuestion}
        onConfirm={questionEditor.handleConfirmDeleteQuestion}
        onClose={() => questionEditor.setPendingDeleteQuestion(null)}
      />

      <ConfirmActionDialog
        open={isPublishConfirmOpen}
        title="Опубликовать текущую версию теста?"
        description="Текущая версия в работе станет опубликованной. После публикации будет создана новая версия в работе для дальнейших изменений."
        confirmLabel="Опубликовать"
        isConfirming={publishMutation.isPending}
        onConfirm={handleConfirmPublish}
        onClose={() => setIsPublishConfirmOpen(false)}
      />
    </>
  );
}
