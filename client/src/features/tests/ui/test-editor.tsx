import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { type DragEvent, useState } from 'react';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import { QUESTION_TYPE_LABELS } from '../lib/tests-utils';

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

    const orderedQuestions = detail.draft.questions;
    const sourceIndex = orderedQuestions.findIndex(
      (question) => question.id === draggingQuestionId,
    );
    const targetIndex = orderedQuestions.findIndex((question) => question.id === targetQuestionId);

    if (sourceIndex < 0 || targetIndex < 0) {
      resetDragState();
      return;
    }

    const dropPosition: DropPosition =
      dropTarget?.questionId === targetQuestionId ? dropTarget.position : 'after';
    let insertIndex = targetIndex + (dropPosition === 'after' ? 1 : 0);

    if (sourceIndex < insertIndex) {
      insertIndex -= 1;
    }

    if (insertIndex === sourceIndex) {
      resetDragState();
      return;
    }

    const reorderedQuestions = [...orderedQuestions];
    const [movedQuestion] = reorderedQuestions.splice(sourceIndex, 1);
    reorderedQuestions.splice(insertIndex, 0, movedQuestion);

    onReorderQuestions(reorderedQuestions.map((question) => question.id));
    resetDragState();
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Редактор теста</CardTitle>
        <CardDescription>Изменение данных теста, вопросов и публикация версии.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {!hasSelection ? (
          <p className="text-sm text-slate-500">Выберите или создайте тест.</p>
        ) : null}
        {hasSelection && loading ? (
          <p className="text-sm text-slate-500">Загрузка версии в работе...</p>
        ) : null}
        {hasSelection && (error || !detail) ? (
          <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{errorMessage ?? 'Не удалось загрузить тест.'}</p>
            <Button type="button" size="sm" variant="outline" onClick={onRetryLoad}>
              Повторить
            </Button>
          </div>
        ) : null}

        {detail ? (
          <>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Slug: {detail.slug}</Badge>
                <Badge variant="outline">В работе v{detail.draft.versionNumber}</Badge>
                <Badge variant="outline">
                  {detail.published
                    ? `Статус: опубликован (v${detail.published.versionNumber})`
                    : 'Статус: не опубликован'}
                </Badge>
              </div>

              <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
                Вы редактируете версию в работе. Пользователи видят только опубликованную версию.
              </div>

              <div className="sticky top-2 z-10 rounded-md border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Действия</p>
                    <p className="text-xs text-slate-500">
                      {draftDirty
                        ? 'Есть несохраненные изменения'
                        : 'Изменения сохранены, можно публиковать'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={onSaveDraft} disabled={!draftDirty || isSavingDraft}>
                      {isSavingDraft ? 'Сохранение...' : 'Сохранить изменения'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={onRequestPublish}
                      disabled={!canPublish || isPublishing}
                    >
                      {isPublishing
                        ? 'Публикация...'
                        : detail.published
                          ? 'Опубликовать изменения'
                          : 'Опубликовать тест'}
                    </Button>
                  </div>
                </div>
                {!canPublish ? (
                  <p className="mt-2 text-xs text-amber-700">
                    Для публикации сохраните изменения и добавьте хотя бы один вопрос.
                  </p>
                ) : null}

                {autosaveHint ? (
                  <p className="mt-2 text-xs text-slate-500">{autosaveHint}</p>
                ) : null}
                {autosaveError ? (
                  <p className="mt-2 text-xs text-red-700">
                    Автосохранение не удалось: {autosaveError}
                  </p>
                ) : null}
              </div>

              <Label htmlFor="draft-title">Название теста</Label>
              <Input
                id="draft-title"
                value={draftTitle}
                onChange={(event) => onDraftTitleChange(event.target.value)}
              />

              <Label htmlFor="draft-description">Описание теста</Label>
              <Textarea
                id="draft-description"
                rows={3}
                value={draftDescription}
                onChange={(event) => onDraftDescriptionChange(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <div>
                <p className="text-sm font-semibold">Вопросы теста</p>
                <p className="text-xs text-slate-500">
                  Добавляйте и редактируйте вопросы в версии в работе через модальное окно.
                </p>
              </div>
              <Button onClick={onCreateQuestion}>Добавить вопрос</Button>
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold">
                Вопросы теста (в работе): {detail.draft.questions.length}
              </p>

              {detail.draft.questions.length > 1 ? (
                <p className="text-xs text-slate-500">
                  Перетаскивайте карточки за иконку слева. Подсветка покажет точное место вставки.
                </p>
              ) : null}
              {isReorderingQuestions ? (
                <p className="text-xs text-sky-700">Сохраняем новый порядок вопросов...</p>
              ) : null}

              {detail.draft.questions.length === 0 ? (
                <p className="text-sm text-slate-500">Пока нет вопросов. Добавьте первый вопрос.</p>
              ) : null}

              {detail.draft.questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  isReorderingQuestions={isReorderingQuestions}
                  isDeletingQuestion={isDeletingQuestion}
                  isDragging={draggingQuestionId === question.id}
                  isDropTarget={
                    dropTarget?.questionId === question.id && draggingQuestionId !== question.id
                  }
                  dropPosition={dropTarget?.questionId === question.id ? dropTarget.position : null}
                  isAnyDragging={draggingQuestionId !== null}
                  onDragStart={(questionId) => setDraggingQuestionId(questionId)}
                  onDragOver={handleQuestionDragOver}
                  onDragEnd={resetDragState}
                  onDrop={handleDropQuestion}
                  onEditQuestion={onEditQuestion}
                  onRequestDeleteQuestion={onRequestDeleteQuestion}
                />
              ))}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

interface QuestionCardProps {
  question: TestDraftQuestion;
  isReorderingQuestions: boolean;
  isDeletingQuestion: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  isAnyDragging: boolean;
  dropPosition: DropPosition | null;
  onDragStart: (questionId: number) => void;
  onDragOver: (questionId: number, event: DragEvent<HTMLDivElement>) => void;
  onDrop: (questionId: number) => void;
  onDragEnd: () => void;
  onEditQuestion: (question: TestDraftQuestion) => void;
  onRequestDeleteQuestion: (question: TestDraftQuestion) => void;
}

function QuestionCard({
  question,
  isReorderingQuestions,
  isDeletingQuestion,
  isDragging,
  isDropTarget,
  isAnyDragging,
  dropPosition,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onEditQuestion,
  onRequestDeleteQuestion,
}: QuestionCardProps) {
  return (
    <Card
      className={`relative border-slate-200 transition-all duration-150 ${isDragging ? 'scale-[0.99] opacity-60 shadow-sm' : ''} ${isDropTarget ? 'ring-2 ring-sky-300' : ''}`}
      draggable={!isReorderingQuestions}
      onDragStart={() => onDragStart(question.id)}
      onDragOver={(event) => onDragOver(question.id, event)}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(question.id);
      }}
      onDragEnd={onDragEnd}
    >
      {isDropTarget && dropPosition === 'before' ? (
        <div className="pointer-events-none absolute -top-1 left-3 right-3 h-1 rounded-full bg-sky-500" />
      ) : null}
      {isDropTarget && dropPosition === 'after' ? (
        <div className="pointer-events-none absolute -bottom-1 left-3 right-3 h-1 rounded-full bg-sky-500" />
      ) : null}
      <CardContent className="space-y-2 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="cursor-grab text-slate-400 active:cursor-grabbing">
                <GripVertical className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold">
                #{question.order} {question.title}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <Badge variant="outline">{QUESTION_TYPE_LABELS[question.type]}</Badge>
              {question.required ? <Badge variant="outline">Обязательный</Badge> : null}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditQuestion(question)}
              disabled={isReorderingQuestions || isAnyDragging}
            >
              <Pencil className="mr-1 h-4 w-4" /> Изменить
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onRequestDeleteQuestion(question)}
              disabled={isDeletingQuestion || isReorderingQuestions || isAnyDragging}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Удалить
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
