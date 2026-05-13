import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { adminClassNames, adminToneClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
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
        <div className={`flex items-center gap-3 text-sm ${adminClassNames.text.body}`}>
          <button
            type="button"
            onClick={() => navigate('/admin/tests')}
            className={adminClassNames.text.hoverHeading}
          >
            ← К списку тестов
          </button>
          <span className={adminClassNames.border.separatorText}>|</span>
          <button
            type="button"
            onClick={() => navigate(`/admin/tests/${topicId}/settings`)}
            className={adminClassNames.text.hoverHeading}
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
    <Card className={adminClassNames.panel.card}>
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
      <div className={`space-y-2 ${adminClassNames.panel.dangerInline}`}>
        <p className={`text-sm ${adminToneClassNames.danger.text}`}>
          {errorMessage ?? 'Не удалось загрузить тест. Проверьте подключение и повторите попытку.'}
        </p>
        <Button type="button" size="sm" variant="outline" onClick={onRetryLoad}>
          Повторить
        </Button>
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
        <p className={`text-sm ${adminClassNames.text.muted}`}>
          Загрузка версии в работе... Пожалуйста, подождите.
        </p>
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
