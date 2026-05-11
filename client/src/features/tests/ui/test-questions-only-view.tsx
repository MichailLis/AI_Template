import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import { TestEditorQuestionsSection } from './test-editor-questions-section';
import { useQuestionReorderDnd } from './use-question-reorder-dnd';

import type { TestDraftQuestion } from '../model/types';
import type { TestsTopicDetailResponseDto } from '@/shared/api/model';

interface TestQuestionsOnlyViewProps {
  loading: boolean;
  error: boolean;
  errorMessage?: string | null;
  detail: TestsTopicDetailResponseDto | undefined;
  isReorderingQuestions: boolean;
  isDeletingQuestion: boolean;
  topicId: number;
  onRetryLoad: () => void;
  onCreateQuestion: () => void;
  onEditQuestion: (question: TestDraftQuestion) => void;
  onRequestDeleteQuestion: (question: TestDraftQuestion) => void;
  onReorderQuestions: (questionIds: number[]) => void;
}

interface TestQuestionsOnlyHeaderProps {
  topicId: number;
  loadingStatus?: string;
}

function TestQuestionsOnlyHeader({ topicId, loadingStatus }: TestQuestionsOnlyHeaderProps) {
  const navigate = useNavigate();

  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Редактор теста</CardTitle>
          <CardDescription>Изменение вопросов теста</CardDescription>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <button
            type="button"
            onClick={() => navigate('/admin/tests')}
            className="hover:text-slate-900"
          >
            ← К списку тестов
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => navigate(`/admin/tests/${topicId}/settings`)}
            className="hover:text-slate-900"
          >
            Настройки
          </button>
          {loadingStatus ? <span className="animate-pulse">{loadingStatus}</span> : null}
        </div>
      </div>
    </CardHeader>
  );
}

interface TestQuestionsOnlyViewCardProps {
  topicId: number;
  loadingStatus?: string;
  children: ReactNode;
}

function TestQuestionsOnlyViewCard({
  topicId,
  loadingStatus,
  children,
}: TestQuestionsOnlyViewCardProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <TestQuestionsOnlyHeader topicId={topicId} loadingStatus={loadingStatus} />
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface TestQuestionsOnlyViewErrorProps {
  topicId: number;
  errorMessage?: string | null;
  onRetryLoad: () => void;
}

function TestQuestionsOnlyViewError({
  topicId,
  errorMessage,
  onRetryLoad,
}: TestQuestionsOnlyViewErrorProps) {
  return (
    <TestQuestionsOnlyViewCard topicId={topicId}>
      <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3">
        <p className="text-sm text-red-700">
          {errorMessage ?? 'Не удалось загрузить тест. Проверьте подключение и повторите попытку.'}
        </p>
        <button
          type="button"
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
          onClick={onRetryLoad}
        >
          Повторить
        </button>
      </div>
    </TestQuestionsOnlyViewCard>
  );
}

export function TestQuestionsOnlyView({
  loading,
  error,
  errorMessage,
  detail,
  isReorderingQuestions,
  isDeletingQuestion,
  topicId,
  onRetryLoad,
  onCreateQuestion,
  onEditQuestion,
  onRequestDeleteQuestion,
  onReorderQuestions,
}: TestQuestionsOnlyViewProps) {
  const questionDnd = useQuestionReorderDnd({
    questions: detail?.draft.questions,
    onReorderQuestions,
  });

  if (loading) {
    return (
      <TestQuestionsOnlyViewCard topicId={topicId} loadingStatus="Загрузка...">
        <p className="text-sm text-slate-500">Загрузка версии в работе... Пожалуйста, подождите.</p>
      </TestQuestionsOnlyViewCard>
    );
  }

  if (error || !detail) {
    return (
      <TestQuestionsOnlyViewError
        topicId={topicId}
        errorMessage={errorMessage}
        onRetryLoad={onRetryLoad}
      />
    );
  }

  return (
    <TestQuestionsOnlyViewCard topicId={topicId}>
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
    </TestQuestionsOnlyViewCard>
  );
}
