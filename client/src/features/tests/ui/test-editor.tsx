import { type ReactNode } from 'react';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import { TestEditorDraftSection } from './test-editor-draft-section';
import { TestEditorQuestionsSection } from './test-editor-questions-section';
import { useQuestionReorderDnd } from './use-question-reorder-dnd';

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

interface TestEditorStateCardProps {
  content: ReactNode;
}

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
  const questionDnd = useQuestionReorderDnd({
    questions: detail?.draft.questions,
    onReorderQuestions,
  });

  if (!hasSelection) {
    return (
      <TestEditorStateCard
        content={
          <p className="text-sm text-slate-500">
            Выберите тест из списка или создайте новый для начала работы.
          </p>
        }
      />
    );
  }

  if (loading) {
    return (
      <TestEditorStateCard
        content={
          <p className="text-sm text-slate-500">
            Загрузка версии в работе... Пожалуйста, подождите.
          </p>
        }
      />
    );
  }

  if (error || !detail) {
    return (
      <TestEditorStateCard
        content={
          <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">
              {errorMessage ??
                'Не удалось загрузить тест. Проверьте подключение и повторите попытку.'}
            </p>
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
          draggingQuestionId={questionDnd.draggingQuestionId}
          dropTarget={questionDnd.dropTarget}
          onCreateQuestion={onCreateQuestion}
          onDragStart={questionDnd.handleDragStart}
          onDragOver={questionDnd.handleDragOver}
          onDragEnd={questionDnd.handleDragEnd}
          onDrop={questionDnd.handleDrop}
          onEditQuestion={onEditQuestion}
          onRequestDeleteQuestion={onRequestDeleteQuestion}
        />
      </CardContent>
    </Card>
  );
}
