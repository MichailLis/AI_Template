import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  AiTestGeneratorModal,
  ConfirmActionDialog,
  QuestionModal,
  TestEditor,
  TestsSidebar,
  hasDraftEdits,
  parseApiError,
  useDraftAutosave,
  useQuestionEditor,
  type TestTopicListItem,
} from '@/features/tests';
import {
  useTestsControllerCreatePublicLink,
  useTestsControllerCreateTopic,
  useTestsControllerCreateTopicFromAi,
  useTestsControllerDeletePublicLink,
  useTestsControllerDeleteTopic,
  useTestsControllerGetAttemptDetail,
  useTestsControllerGetTopicDraft,
  useTestsControllerListArchivedPublicLinks,
  useTestsControllerListPublicLinkAttempts,
  useTestsControllerListPublicLinks,
  useTestsControllerListTopics,
  useTestsControllerPublishTopic,
  useTestsControllerRegeneratePublicLinkShortCode,
  useTestsControllerRestorePublicLink,
  useTestsControllerReorderQuestions,
  useTestsControllerUpdatePublicLink,
} from '@/shared/api/generated/tests/tests';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import type { CreateTestsTopicFromAiDto } from '@/shared/api/model';

type PublicLinksTab = 'active' | 'archived';

export function AdminTestsWorkspace() {
  const topicsQuery = useTestsControllerListTopics();
  const createTopicMutation = useTestsControllerCreateTopic();
  const createTopicFromAiMutation = useTestsControllerCreateTopicFromAi();
  const deleteTopicMutation = useTestsControllerDeleteTopic();
  const reorderQuestionsMutation = useTestsControllerReorderQuestions();
  const publishMutation = useTestsControllerPublishTopic();
  const listPublicLinksQuery = useTestsControllerListPublicLinks();
  const listArchivedPublicLinksQuery = useTestsControllerListArchivedPublicLinks();
  const createPublicLinkMutation = useTestsControllerCreatePublicLink();
  const deletePublicLinkMutation = useTestsControllerDeletePublicLink();
  const updatePublicLinkMutation = useTestsControllerUpdatePublicLink();
  const regeneratePublicLinkShortCodeMutation = useTestsControllerRegeneratePublicLinkShortCode();
  const restorePublicLinkMutation = useTestsControllerRestorePublicLink();

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

  const [newPublicShortCode, setNewPublicShortCode] = useState('');
  const [newPublicMaxAttempts, setNewPublicMaxAttempts] = useState('3');
  const [newPublicTimeLimit, setNewPublicTimeLimit] = useState('30');
  const [newPublicAllowResume, setNewPublicAllowResume] = useState(true);
  const [newPublicConsentVersion, setNewPublicConsentVersion] = useState('v1');
  const [newPublicConsentText, setNewPublicConsentText] = useState(
    'Я даю согласие на обработку персональных данных для прохождения тестирования и формирования аналитики.',
  );
  const [selectedPublicLinkId, setSelectedPublicLinkId] = useState<number | null>(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);
  const [pendingDeletePublicLinkId, setPendingDeletePublicLinkId] = useState<number | null>(null);
  const [publicLinksTab, setPublicLinksTab] = useState<PublicLinksTab>('active');

  const topics = useMemo(() => topicsQuery.data?.topics ?? [], [topicsQuery.data?.topics]);
  const activePublicLinks = useMemo(
    () => listPublicLinksQuery.data?.links ?? [],
    [listPublicLinksQuery.data?.links],
  );
  const archivedPublicLinks = useMemo(
    () => listArchivedPublicLinksQuery.data?.links ?? [],
    [listArchivedPublicLinksQuery.data?.links],
  );
  const visiblePublicLinks = useMemo(
    () => (publicLinksTab === 'active' ? activePublicLinks : archivedPublicLinks),
    [activePublicLinks, archivedPublicLinks, publicLinksTab],
  );

  const effectiveSelectedTopicId = useMemo(() => {
    if (topics.length === 0) {
      return null;
    }

    if (selectedTopicId && topics.some((topic) => topic.id === selectedTopicId)) {
      return selectedTopicId;
    }

    return topics[0].id;
  }, [selectedTopicId, topics]);

  const effectivePublicLinkId = useMemo(() => {
    if (visiblePublicLinks.length === 0) {
      return null;
    }

    if (
      selectedPublicLinkId &&
      visiblePublicLinks.some((link) => link.id === selectedPublicLinkId)
    ) {
      return selectedPublicLinkId;
    }

    return visiblePublicLinks[0].id;
  }, [visiblePublicLinks, selectedPublicLinkId]);

  const publicAttemptsQuery = useTestsControllerListPublicLinkAttempts(effectivePublicLinkId ?? 0, {
    query: {
      enabled: Boolean(effectivePublicLinkId),
    },
  });

  const publicAttempts = useMemo(
    () => publicAttemptsQuery.data?.attempts ?? [],
    [publicAttemptsQuery.data?.attempts],
  );

  const effectiveAttemptId = useMemo(() => {
    if (publicAttempts.length === 0) {
      return null;
    }

    if (
      selectedAttemptId &&
      publicAttempts.some((attempt) => attempt.attemptId === selectedAttemptId)
    ) {
      return selectedAttemptId;
    }

    return publicAttempts[0].attemptId;
  }, [publicAttempts, selectedAttemptId]);

  const attemptDetailQuery = useTestsControllerGetAttemptDetail(effectiveAttemptId ?? 0, {
    query: {
      enabled: Boolean(effectiveAttemptId),
    },
  });

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

  const getShortLinkUrl = (shortCode: string) => {
    if (typeof window === 'undefined') {
      return `/t/${shortCode}`;
    }

    return `${window.location.origin}/t/${shortCode}`;
  };

  const handleCreatePublicLink = () => {
    const publishedVersionId = detail?.published?.id;

    if (!publishedVersionId) {
      toast.error('Сначала опубликуйте версию теста, затем создайте публичную ссылку');
      return;
    }

    const parsedMaxAttempts = Number.parseInt(newPublicMaxAttempts, 10);
    if (!Number.isInteger(parsedMaxAttempts) || parsedMaxAttempts < 1) {
      toast.error('Лимит попыток должен быть целым числом больше 0');
      return;
    }

    const parsedTimeLimit = newPublicTimeLimit.trim()
      ? Number.parseInt(newPublicTimeLimit.trim(), 10)
      : null;

    if (newPublicTimeLimit.trim() && (!parsedTimeLimit || parsedTimeLimit < 1)) {
      toast.error('Ограничение времени должно быть целым числом минут больше 0');
      return;
    }

    createPublicLinkMutation.mutate(
      {
        data: {
          publishedVersionId,
          shortCode: newPublicShortCode.trim() || undefined,
          maxAttemptsPerStudent: parsedMaxAttempts,
          timeLimitMinutes: parsedTimeLimit,
          allowResume: newPublicAllowResume,
          consentVersion: newPublicConsentVersion.trim() || 'v1',
          consentText: newPublicConsentText.trim(),
        },
      },
      {
        onSuccess: (link) => {
          toast.success('Публичная ссылка создана');
          setPublicLinksTab('active');
          setSelectedPublicLinkId(link.id);
          setSelectedAttemptId(null);
          setNewPublicShortCode('');
          void Promise.all([
            listPublicLinksQuery.refetch(),
            listArchivedPublicLinksQuery.refetch(),
          ]);
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleTogglePublicLink = (linkId: number, nextActive: boolean) => {
    updatePublicLinkMutation.mutate(
      {
        linkId,
        data: {
          isActive: nextActive,
        },
      },
      {
        onSuccess: () => {
          toast.success(nextActive ? 'Ссылка активирована' : 'Ссылка деактивирована');
          void Promise.all([
            listPublicLinksQuery.refetch(),
            listArchivedPublicLinksQuery.refetch(),
          ]);
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleRegeneratePublicLinkShortCode = (linkId: number) => {
    regeneratePublicLinkShortCodeMutation.mutate(
      {
        linkId,
      },
      {
        onSuccess: (link) => {
          toast.success('Короткий код обновлен');
          setSelectedPublicLinkId(link.id);
          setSelectedAttemptId(null);
          void Promise.all([
            listPublicLinksQuery.refetch(),
            listArchivedPublicLinksQuery.refetch(),
          ]);
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleDeletePublicLink = () => {
    if (!pendingDeletePublicLinkId) {
      return;
    }

    const deletingId = pendingDeletePublicLinkId;

    deletePublicLinkMutation.mutate(
      {
        linkId: deletingId,
      },
      {
        onSuccess: () => {
          toast.success('Ссылка архивирована и скрыта из списка');
          setPendingDeletePublicLinkId(null);
          if (selectedPublicLinkId === deletingId) {
            setSelectedPublicLinkId(null);
            setSelectedAttemptId(null);
          }
          void Promise.all([
            listPublicLinksQuery.refetch(),
            listArchivedPublicLinksQuery.refetch(),
          ]);
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleRestorePublicLink = (linkId: number) => {
    restorePublicLinkMutation.mutate(
      {
        linkId,
      },
      {
        onSuccess: (link) => {
          toast.success('Ссылка восстановлена');
          setPublicLinksTab('active');
          setSelectedPublicLinkId(link.id);
          setSelectedAttemptId(null);
          void Promise.all([
            listPublicLinksQuery.refetch(),
            listArchivedPublicLinksQuery.refetch(),
          ]);
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleSwitchPublicLinksTab = (tab: PublicLinksTab) => {
    setPublicLinksTab(tab);
    setSelectedPublicLinkId(null);
    setSelectedAttemptId(null);
  };

  const copyShortLink = async (shortCode: string) => {
    try {
      await navigator.clipboard.writeText(getShortLinkUrl(shortCode));
      toast.success('Короткая ссылка скопирована');
    } catch {
      toast.error('Не удалось скопировать ссылку');
    }
  };

  const autosaveHint = draftAutosave.isAutoSavingDraft
    ? 'Автосохранение...'
    : draftAutosave.lastAutoSavedAt
      ? `Автосохранено в ${draftAutosave.lastAutoSavedAt}`
      : null;
  const selectedPublicLink =
    visiblePublicLinks.find((link) => link.id === effectivePublicLinkId) ?? null;
  const selectedAttemptDetail = attemptDetailQuery.data ?? null;

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

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Публичные ссылки и QR</CardTitle>
            <CardDescription>
              Создавайте короткие ссылки на опубликованные версии тестов и управляйте доступом.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="public-short-code">Короткий код (опционально)</Label>
                <Input
                  id="public-short-code"
                  value={newPublicShortCode}
                  onChange={(event) => setNewPublicShortCode(event.target.value.toUpperCase())}
                  placeholder="Например: TEST2026"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="public-max-attempts">Лимит попыток</Label>
                <Input
                  id="public-max-attempts"
                  type="number"
                  min={1}
                  value={newPublicMaxAttempts}
                  onChange={(event) => setNewPublicMaxAttempts(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="public-time-limit">Лимит времени (минуты, опционально)</Label>
                <Input
                  id="public-time-limit"
                  type="number"
                  min={1}
                  value={newPublicTimeLimit}
                  onChange={(event) => setNewPublicTimeLimit(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="public-consent-version">Версия согласия</Label>
                <Input
                  id="public-consent-version"
                  value={newPublicConsentVersion}
                  onChange={(event) => setNewPublicConsentVersion(event.target.value)}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="public-consent-text">Текст согласия</Label>
                <Textarea
                  id="public-consent-text"
                  value={newPublicConsentText}
                  onChange={(event) => setNewPublicConsentText(event.target.value)}
                  className="min-h-24"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={newPublicAllowResume}
                onChange={(event) => setNewPublicAllowResume(event.target.checked)}
              />
              Разрешить возобновление незавершенной попытки
            </label>

            <Button
              type="button"
              onClick={handleCreatePublicLink}
              disabled={createPublicLinkMutation.isPending}
            >
              {createPublicLinkMutation.isPending ? 'Создаем...' : 'Создать публичную ссылку'}
            </Button>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={publicLinksTab === 'active' ? 'default' : 'outline'}
                onClick={() => handleSwitchPublicLinksTab('active')}
              >
                Активные
              </Button>
              <Button
                type="button"
                size="sm"
                variant={publicLinksTab === 'archived' ? 'default' : 'outline'}
                onClick={() => handleSwitchPublicLinksTab('archived')}
              >
                Архив
              </Button>
            </div>

            <div className="space-y-2">
              {visiblePublicLinks.map((link) => (
                <div
                  key={link.id}
                  className={`rounded-md border p-3 ${
                    link.id === effectivePublicLinkId
                      ? 'border-primary bg-slate-50'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="text-left text-sm font-medium text-slate-900 underline-offset-2 hover:underline"
                      onClick={() => {
                        setSelectedPublicLinkId(link.id);
                        setSelectedAttemptId(null);
                      }}
                    >
                      {link.shortCode}
                    </button>
                    <span className="text-xs text-slate-600">{link.title}</span>
                    <span className="ml-auto text-xs text-slate-500">
                      {link.archivedAt ? 'В архиве' : link.isActive ? 'Активна' : 'Отключена'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {publicLinksTab === 'active' ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void copyShortLink(link.shortCode)}
                        >
                          Копировать ссылку
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.open(
                              `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                                getShortLinkUrl(link.shortCode),
                              )}`,
                              '_blank',
                              'noopener,noreferrer',
                            )
                          }
                        >
                          Открыть QR
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleTogglePublicLink(link.id, !link.isActive)}
                          disabled={updatePublicLinkMutation.isPending}
                        >
                          {link.isActive ? 'Деактивировать' : 'Активировать'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleRegeneratePublicLinkShortCode(link.id)}
                          disabled={regeneratePublicLinkShortCodeMutation.isPending}
                        >
                          Обновить код
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => setPendingDeletePublicLinkId(link.id)}
                          disabled={deletePublicLinkMutation.isPending}
                        >
                          Архивировать
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestorePublicLink(link.id)}
                        disabled={restorePublicLinkMutation.isPending}
                      >
                        Восстановить
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {visiblePublicLinks.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {publicLinksTab === 'active'
                    ? 'Публичные ссылки еще не созданы. Опубликуйте версию теста и создайте первую ссылку.'
                    : 'Архив пуст. Здесь появятся ссылки после архивирования.'}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Статистика прохождения</CardTitle>
            <CardDescription>
              {selectedPublicLink
                ? `Ссылка: ${selectedPublicLink.shortCode}`
                : 'Выберите публичную ссылку'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {publicAttempts.map((attempt) => (
              <button
                key={attempt.attemptId}
                type="button"
                className={`w-full rounded-md border p-3 text-left ${
                  attempt.attemptId === effectiveAttemptId
                    ? 'border-primary bg-slate-50'
                    : 'border-slate-200'
                }`}
                onClick={() => setSelectedAttemptId(attempt.attemptId)}
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{attempt.studentName}</span>
                  <span className="text-xs text-slate-500">#{attempt.attemptNumber}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  {attempt.educationOrganization} • {attempt.groupOrClass}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Статус: {attempt.status} • Старт: {new Date(attempt.startedAt).toLocaleString()}
                </p>
              </button>
            ))}

            {publicAttemptsQuery.isLoading ? (
              <p className="text-sm text-slate-500">Загружаем попытки...</p>
            ) : null}

            {effectivePublicLinkId &&
            !publicAttemptsQuery.isLoading &&
            publicAttempts.length === 0 ? (
              <p className="text-sm text-slate-500">По этой ссылке пока нет попыток.</p>
            ) : null}

            {selectedAttemptDetail ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-800">
                  Детали попытки #{selectedAttemptDetail.attemptNumber}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Согласие: {selectedAttemptDetail.consentVersion}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Ответов: {selectedAttemptDetail.answers.length}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Анализ: {selectedAttemptDetail.analysis?.status ?? 'нет'}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
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
        open={Boolean(pendingDeletePublicLinkId)}
        title="Архивировать публичную ссылку?"
        description="Ссылка станет недоступной и исчезнет из списка. Данные попыток сохранятся."
        confirmLabel="Архивировать"
        variant="destructive"
        isConfirming={deletePublicLinkMutation.isPending}
        onConfirm={handleDeletePublicLink}
        onClose={() => setPendingDeletePublicLinkId(null)}
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
