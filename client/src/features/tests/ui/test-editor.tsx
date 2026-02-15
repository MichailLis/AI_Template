import { type DragEvent, type ReactNode, useState } from 'react';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import { TestEditorDraftSection } from './test-editor-draft-section';
import { TestEditorQuestionsSection } from './test-editor-questions-section';

import type { TestDraftQuestion } from '../model/types';
import type { TestsTopicDetailResponseDto } from '@/shared/api/model';

interface TestEditorProps {
  hasSelection: boolean;
  loading: boolean;
  error: boolean;
  errorMessage?: string | null;
  detail: TestsTopicDetailResponseDto | undefined;
  draftTitle: string;
  draftDescription: string;
  draftDirty: boolean;
  canPublish: boolean;
  isSavingDraft: boolean;
  isPublishing: boolean;
  isReorderingQuestions: boolean;
  isDeletingQuestion: boolean;
  autosaveHint: string | null;
  autosaveError: string | null;
  onDraftTitleChange: (value: string) => void;
  onDraftDescriptionChange: (value: string) => void;
  onSaveDraft: () => void;
  onRequestPublish: () => void;
  onCreateQuestion: () => void;
  onEditQuestion: (question: TestDraftQuestion) => void;
  onRequestDeleteQuestion: (question: TestDraftQuestion) => void;
  onReorderQuestions: (questionIds: number[]) => void;
  onRetryLoad: () => void;
}

type DropPosition = 'before' | 'after';

interface TestEditorStateCardProps {
  content: ReactNode;
}

const buildReorderedQuestionIds = (
  orderedQuestions: TestDraftQuestion[],
  draggingQuestionId: number,
  targetQuestionId: number,
  dropPosition: DropPosition,
) => {
  const sourceIndex = orderedQuestions.findIndex((question) => question.id === draggingQuestionId);
  const targetIndex = orderedQuestions.findIndex((question) => question.id === targetQuestionId);

  if (sourceIndex < 0 || targetIndex < 0) {
    return null;
  }

  let insertIndex = targetIndex + (dropPosition === 'after' ? 1 : 0);
  if (sourceIndex < insertIndex) {
    insertIndex -= 1;
  }

  if (insertIndex === sourceIndex) {
    return null;
  }

  const reorderedQuestions = [...orderedQuestions];
  const [movedQuestion] = reorderedQuestions.splice(sourceIndex, 1);
  reorderedQuestions.splice(insertIndex, 0, movedQuestion);

  return reorderedQuestions.map((question) => question.id);
};

function TestEditorStateCard({ content }: TestEditorStateCardProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Редактор теста</CardTitle>
        <CardDescription>Изменение данных теста, вопросов и публикация версии.</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

export function TestEditor({
  hasSelection,
  loading,
  error,
  errorMessage,
  detail,
  draftTitle,
  draftDescription,
  draftDirty,
  canPublish,
  isSavingDraft,
  isPublishing,
  isReorderingQuestions,
  isDeletingQuestion,
  autosaveHint,
  autosaveError,
  onDraftTitleChange,
  onDraftDescriptionChange,
  onSaveDraft,
  onRequestPublish,
  onCreateQuestion,
  onEditQuestion,
  onRequestDeleteQuestion,
  onReorderQuestions,
  onRetryLoad,
}: TestEditorProps) {
  const [draggingQuestionId, setDraggingQuestionId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    questionId: number;
    position: DropPosition;
  } | null>(null);

  const resetDragState = () => {
    setDraggingQuestionId(null);
    setDropTarget(null);
  };

  const handleQuestionDragOver = (questionId: number, event: DragEvent<HTMLDivElement>) => {
    if (draggingQuestionId === null || draggingQuestionId === questionId) {
      setDropTarget(null);
      return;
    }

    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerOffset = event.clientY - bounds.top;
    const position: DropPosition = pointerOffset < bounds.height / 2 ? 'before' : 'after';

    setDropTarget((previous) => {
      if (previous?.questionId === questionId && previous.position === position) {
        return previous;
      }

      return {
        questionId,
        position,
      };
    });
  };

  const handleDropQuestion = (targetQuestionId: number) => {
    if (!detail || draggingQuestionId === null || draggingQuestionId === targetQuestionId) {
      resetDragState();
      return;
    }

    const dropPosition: DropPosition =
      dropTarget?.questionId === targetQuestionId ? dropTarget.position : 'after';
    const reorderedQuestionIds = buildReorderedQuestionIds(
      detail.draft.questions,
      draggingQuestionId,
      targetQuestionId,
      dropPosition,
    );

    if (!reorderedQuestionIds) {
      resetDragState();
      return;
    }

    onReorderQuestions(reorderedQuestionIds);
    resetDragState();
  };

  if (!hasSelection) {
    return (
      <TestEditorStateCard
        content={<p className="text-sm text-slate-500">Выберите или создайте тест.</p>}
      />
    );
  }

  if (loading) {
    return (
      <TestEditorStateCard
        content={<p className="text-sm text-slate-500">Загрузка версии в работе...</p>}
      />
    );
  }

  if (error || !detail) {
    return (
      <TestEditorStateCard
        content={
          <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{errorMessage ?? 'Не удалось загрузить тест.'}</p>
            <Button type="button" size="sm" variant="outline" onClick={onRetryLoad}>
              Повторить
            </Button>
          </div>
        }
      />
    );
  }

  let publishButtonLabel = 'Опубликовать тест';
  if (isPublishing) {
    publishButtonLabel = 'Публикация...';
  } else if (detail.published) {
    publishButtonLabel = 'Опубликовать изменения';
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Редактор теста</CardTitle>
        <CardDescription>Изменение данных теста, вопросов и публикация версии.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <TestEditorDraftSection
          slug={detail.slug}
          draftVersionNumber={detail.draft.versionNumber}
          publishedVersionNumber={detail.published?.versionNumber ?? null}
          draftDirty={draftDirty}
          canPublish={canPublish}
          isSavingDraft={isSavingDraft}
          isPublishing={isPublishing}
          autosaveHint={autosaveHint}
          autosaveError={autosaveError}
          draftTitle={draftTitle}
          draftDescription={draftDescription}
          publishButtonLabel={publishButtonLabel}
          onSaveDraft={onSaveDraft}
          onRequestPublish={onRequestPublish}
          onDraftTitleChange={onDraftTitleChange}
          onDraftDescriptionChange={onDraftDescriptionChange}
        />

        <TestEditorQuestionsSection
          questions={detail.draft.questions}
          isReorderingQuestions={isReorderingQuestions}
          isDeletingQuestion={isDeletingQuestion}
          draggingQuestionId={draggingQuestionId}
          dropTarget={dropTarget}
          onCreateQuestion={onCreateQuestion}
          onDragStart={(questionId) => setDraggingQuestionId(questionId)}
          onDragOver={handleQuestionDragOver}
          onDragEnd={resetDragState}
          onDrop={handleDropQuestion}
          onEditQuestion={onEditQuestion}
          onRequestDeleteQuestion={onRequestDeleteQuestion}
        />
      </CardContent>
    </Card>
  );
}
