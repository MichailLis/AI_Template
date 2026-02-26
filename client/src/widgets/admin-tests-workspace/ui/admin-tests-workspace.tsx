import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  AiTestGeneratorModal,
  QuestionModal,
  TestQuestionsOnlyView,
  TestsCreateModal,
  TestsListCard,
  TestsListHeader,
} from '@/features/tests';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import { AdminTestsConfirmDialogs } from './admin-tests-confirm-dialogs';
import { useAdminTestsWorkspace } from './use-admin-tests-workspace';

export function AdminTestsWorkspace() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const {
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
    listMode,
    newTestTitle,
    newTestSlug,
    newTestDescription,
    testSearch,
    isAiGeneratorOpen,
    isPublishConfirmOpen,
    pendingDeleteTopic,
    isSwitchConfirmOpen,
    isNavigationConfirmOpen,
    pendingNavigationPath,
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
    setPendingArchiveTopic,
    setPendingRestoreTopic,
    setListMode,
    setIsSwitchConfirmOpen,
    setIsPublishConfirmOpen,
    setIsNavigationConfirmOpen,
    setPendingNavigationPath,
    updateCurrentDraftEdits,
    discardCurrentDraftEditsAndResetAutosave,
    handleAttemptNavigation,
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
    pendingArchiveTopic,
    pendingRestoreTopic,
    isSelectedTopicArchived,
    archiveTopicMutation,
    restoreTopicMutation,
  } = useAdminTestsWorkspace();

  const isListRoute = location.pathname === '/admin/tests';
  const isSettingsRoute =
    effectiveSelectedTopicId !== null && location.pathname.endsWith('/settings');
  const currentPathRef = useRef(location.pathname + location.search + location.hash);

  useEffect(() => {
    currentPathRef.current = location.pathname + location.search + location.hash;
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const handleBrowserPopState = () => {
      const nextPath = window.location.pathname + window.location.search + window.location.hash;
      const currentPath = currentPathRef.current;

      if (!isDraftDirty || nextPath === currentPath) {
        currentPathRef.current = nextPath;
        return;
      }

      window.history.pushState(window.history.state, '', currentPath);
      setPendingNavigationPath(nextPath);
      setIsNavigationConfirmOpen(true);
    };

    window.addEventListener('popstate', handleBrowserPopState);

    return () => {
      window.removeEventListener('popstate', handleBrowserPopState);
    };
  }, [isDraftDirty, setIsNavigationConfirmOpen, setPendingNavigationPath]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!isDraftDirty || event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (anchor.target && anchor.target !== '_self') {
        return;
      }

      if (anchor.hasAttribute('download')) {
        return;
      }

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      const targetUrl = new URL(anchor.href, window.location.href);
      if (targetUrl.origin !== window.location.origin) {
        return;
      }

      const targetPath = targetUrl.pathname + targetUrl.search + targetUrl.hash;
      if (targetPath === currentPathRef.current) {
        return;
      }

      event.preventDefault();
      handleAttemptNavigation(targetPath);
    };

    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [handleAttemptNavigation, isDraftDirty]);

  useEffect(() => {
    if (isListRoute || !isCreateModalOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsCreateModalOpen(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isCreateModalOpen, isListRoute]);

  // Wrapper handlers for switch confirm dialog
  const handleConfirmStay = () => {
    setIsSwitchConfirmOpen(false);
    setPendingTopicSwitchId(null);
  };

  const handleConfirmLeave = () => {
    setIsSwitchConfirmOpen(false);
    setPendingTopicSwitchId(null);
    handleConfirmTopicSwitch();
  };

  const handleNavigationLeave = () => {
    discardCurrentDraftEditsAndResetAutosave();
    setIsNavigationConfirmOpen(false);

    if (pendingNavigationPath) {
      navigate(pendingNavigationPath);
    }

    setPendingNavigationPath(null);
  };

  const handleNavigationStay = () => {
    setIsNavigationConfirmOpen(false);
    setPendingNavigationPath(null);
  };

  const handleWorkspaceNavigate = (targetPath: string) => {
    if (!handleAttemptNavigation(targetPath)) {
      return;
    }

    navigate(targetPath);
  };

  const onDraftTitleChange = (value: string) => {
    updateCurrentDraftEdits({ title: value });
  };

  const onDraftDescriptionChange = (value: string) => {
    updateCurrentDraftEdits({ description: value });
  };

  const onSaveDraft = () => {
    draftAutosave.saveDraft('manual');
  };

  const onRequestPublish = () => {
    setIsPublishConfirmOpen(true);
  };

  const publishButtonLabel = (() => {
    if (publishMutation.isPending) {
      return 'Публикация...';
    }
    if (detail?.published) {
      return 'Опубликовать изменения';
    }
    return 'Опубликовать тест';
  })();

  const draftStatusText = (() => {
    if (isSelectedTopicArchived) {
      return 'Редактирование отключено: тест в архиве';
    }
    if (isDraftDirty) {
      return 'Есть несохраненные изменения';
    }
    return 'Изменения сохранены';
  })();

  const publishHintText = (() => {
    if (isSelectedTopicArchived) {
      return 'Восстановите тест, чтобы открыть публикацию.';
    }
    if (!canPublish) {
      return 'Для публикации сохраните изменения и добавьте хотя бы один вопрос.';
    }
    return null;
  })();

  return (
    <>
      <div className="grid gap-4">
        {(() => {
          if (isListRoute) {
            return (
              <div>
                <TestsListHeader
                  searchValue={testSearch}
                  listMode={listMode}
                  onSearchChange={setTestSearch}
                  onListModeChange={setListMode}
                  onOpenCreateModal={() => setIsCreateModalOpen(true)}
                  onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
                />
                <TestsListCard
                  topics={topics}
                  listMode={listMode}
                  topicsLoading={topicsQuery.isLoading}
                  topicsError={topicsQuery.isError}
                  topicsErrorMessage={topicsErrorMessage}
                  searchValue={testSearch}
                  isArchivingTopic={archiveTopicMutation.isPending}
                  archivingTopicId={pendingArchiveTopic?.id ?? null}
                  isRestoringTopic={restoreTopicMutation.isPending}
                  restoringTopicId={pendingRestoreTopic?.id ?? null}
                  isDeletingTopic={deleteTopicMutation.isPending}
                  deletingTopicId={pendingDeleteTopic?.id ?? null}
                  onSelectTest={handleSelectTest}
                  onOpenSettings={(topicId) =>
                    handleWorkspaceNavigate(`/admin/tests/${topicId}/settings`)
                  }
                  onRequestArchiveTest={setPendingArchiveTopic}
                  onRequestRestoreTest={setPendingRestoreTopic}
                  onRequestDeleteTest={setPendingDeleteTopic}
                  onRetryTopics={() => {
                    void topicsQuery.refetch();
                  }}
                />
              </div>
            );
          }

          if (isSettingsRoute && effectiveSelectedTopicId !== null) {
            return (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle>Настройки теста</CardTitle>
                      <CardDescription>
                        Изменение метаданных черновика и управление публикацией
                      </CardDescription>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectTest(effectiveSelectedTopicId)}
                      className="text-sm text-slate-600 hover:text-slate-900"
                    >
                      ← К вопросам
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-medium text-slate-900">Метаданные теста</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Редактирование названия и описания версии в работе.
                    </p>
                    <div className="mt-3 space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="settings-draft-title">Название теста</Label>
                        <Input
                          id="settings-draft-title"
                          value={draftForm.title}
                          disabled={isSelectedTopicArchived}
                          onChange={(event) => onDraftTitleChange(event.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="settings-draft-description">Описание теста</Label>
                        <Textarea
                          id="settings-draft-description"
                          rows={3}
                          value={draftForm.description}
                          disabled={isSelectedTopicArchived}
                          onChange={(event) => onDraftDescriptionChange(event.target.value)}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          onClick={onSaveDraft}
                          disabled={
                            isSelectedTopicArchived || !isDraftDirty || draftAutosave.isSavingDraft
                          }
                        >
                          {draftAutosave.isSavingDraft ? 'Сохранение...' : 'Сохранить изменения'}
                        </Button>
                        <p className="text-xs text-slate-500">{draftStatusText}</p>
                      </div>
                      {autosaveHint ? (
                        <p className="text-xs text-slate-500">{autosaveHint}</p>
                      ) : null}
                      {draftAutosave.autoSaveError ? (
                        <p className="text-xs text-red-700">
                          Автосохранение не удалось: {draftAutosave.autoSaveError}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-medium text-slate-900">Опубликованный срез</p>
                    {detail?.published ? (
                      <div className="mt-2 space-y-1 text-sm text-slate-700">
                        <p>
                          Версия:{' '}
                          <span className="font-medium">v{detail.published.versionNumber}</span>
                        </p>
                        <p>
                          Название: <span className="font-medium">{detail.published.title}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-slate-600">Тест еще не опубликован.</p>
                    )}
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-medium text-slate-900">Публикация</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Публикация запускается через подтверждение и создает новый черновик для
                      дальнейших правок.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={onRequestPublish}
                        disabled={
                          isSelectedTopicArchived || !canPublish || publishMutation.isPending
                        }
                      >
                        {publishButtonLabel}
                      </Button>
                      {publishHintText ? (
                        <p className="text-xs text-amber-700">{publishHintText}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-medium text-slate-900">Переключатель активности</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-700">Активен для студентов</p>
                        <p className="text-xs text-slate-500">
                          Если выключить, тест уйдет в архив. Для возобновления включите обратно.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!isSelectedTopicArchived}
                        disabled={archiveTopicMutation.isPending || restoreTopicMutation.isPending}
                        aria-label="Переключатель активности теста"
                        onClick={() => handleToggleTopicActive(isSelectedTopicArchived)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          isSelectedTopicArchived ? 'bg-slate-300' : 'bg-emerald-500'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
                            isSelectedTopicArchived ? 'translate-x-1' : 'translate-x-5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }

          return (
            <TestQuestionsOnlyView
              loading={detailQuery.isLoading}
              error={detailQuery.isError}
              errorMessage={detailErrorMessage}
              detail={detail}
              isReorderingQuestions={reorderQuestionsMutation.isPending}
              isDeletingQuestion={questionEditor.isDeletingQuestion}
              topicId={effectiveSelectedTopicId ?? 0}
              onRetryLoad={() => {
                void detailQuery.refetch();
              }}
              onCreateQuestion={questionEditor.openCreateQuestionModal}
              onEditQuestion={questionEditor.openEditQuestionModal}
              onRequestDeleteQuestion={questionEditor.setPendingDeleteQuestion}
              onReorderQuestions={handleReorderQuestions}
            />
          );
        })()}
      </div>

      <TestsCreateModal
        open={isListRoute && isCreateModalOpen}
        isCreating={createTopicMutation.isPending}
        newTestTitle={newTestTitle}
        newTestSlug={newTestSlug}
        newTestDescription={newTestDescription}
        onOpenChange={setIsCreateModalOpen}
        onNewTestTitleChange={setNewTestTitle}
        onNewTestSlugChange={setNewTestSlug}
        onNewTestDescriptionChange={setNewTestDescription}
        onCreateTest={handleCreateTest}
      />

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

      <AdminTestsConfirmDialogs
        isSwitchConfirmOpen={isSwitchConfirmOpen}
        onConfirmTopicSwitch={handleConfirmLeave}
        onCloseTopicSwitch={handleConfirmStay}
        isDiscardQuestionConfirmOpen={questionEditor.isDiscardQuestionConfirmOpen}
        onConfirmDiscardQuestion={questionEditor.closeQuestionModalDirect}
        onCloseDiscardQuestion={() => questionEditor.setIsDiscardQuestionConfirmOpen(false)}
        pendingDeleteTopic={pendingDeleteTopic}
        isDeletingTopic={deleteTopicMutation.isPending}
        onConfirmDeleteTopic={handleConfirmDeleteTopic}
        onCloseDeleteTopic={() => setPendingDeleteTopic(null)}
        pendingArchiveTopic={pendingArchiveTopic}
        isArchivingTopic={archiveTopicMutation.isPending}
        onConfirmArchiveTopic={handleConfirmArchiveTopic}
        onCloseArchiveTopic={() => setPendingArchiveTopic(null)}
        pendingRestoreTopic={pendingRestoreTopic}
        isRestoringTopic={restoreTopicMutation.isPending}
        onConfirmRestoreTopic={handleConfirmRestoreTopic}
        onCloseRestoreTopic={() => setPendingRestoreTopic(null)}
        pendingDeleteQuestion={questionEditor.pendingDeleteQuestion}
        isDeletingQuestion={questionEditor.isDeletingQuestion}
        onConfirmDeleteQuestion={questionEditor.handleConfirmDeleteQuestion}
        onCloseDeleteQuestion={() => questionEditor.setPendingDeleteQuestion(null)}
        isPublishConfirmOpen={isPublishConfirmOpen}
        isPublishing={publishMutation.isPending}
        onConfirmPublish={handleConfirmPublish}
        onClosePublish={() => setIsPublishConfirmOpen(false)}
        isNavigationConfirmOpen={isNavigationConfirmOpen}
        onConfirmNavigationLeave={handleNavigationLeave}
        onConfirmNavigationStay={handleNavigationStay}
      />
    </>
  );
}
