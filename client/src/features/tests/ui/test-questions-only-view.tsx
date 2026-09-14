import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { adminClassNames, adminToneClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminSkeletonRows } from '@/shared/ui/admin-skeleton';
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
  topicTitle?: string;
  questionCount?: number;
  loadingStatus?: string;
}

/**
 * В заголовке стоит название редактируемого теста: раньше и шапка админки, и карточка говорили
 * только «Тесты» / «Редактор теста», и по экрану нельзя было понять, какой именно тест открыт.
 */
function TestQuestionsOnlyHeader({
  topicId,
  topicTitle,
  questionCount,
  loadingStatus,
}: TestQuestionsOnlyHeaderProps) {
  const navigate = useNavigate();

  return (
    <CardHeader>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className={adminClassNames.text.kicker}>Редактор теста</p>
          <CardTitle className="truncate">{topicTitle ?? 'Вопросы теста'}</CardTitle>
          <CardDescription>
            {typeof questionCount === 'number'
              ? `Вопросов в версии в работе: ${questionCount}`
              : 'Изменение вопросов теста'}
          </CardDescription>
        </div>
        <div className={`flex flex-wrap items-center gap-2 text-sm ${adminClassNames.text.body}`}>
          <button
            type="button"
            onClick={() => navigate('/admin/tests')}
            className={adminClassNames.text.hoverHeading}
          >
            ← К списку тестов
          </button>
          <span className={adminClassNames.border.separatorText}>/</span>
          <button
            type="button"
            onClick={() => navigate(`/admin/tests/${topicId}/settings`)}
            className={adminClassNames.text.hoverHeading}
          >
            {/* Не просто «Настройки»: так называется пункт меню с глобальными ключами и интеграциями. */}
            Настройки теста
          </button>
          {loadingStatus ? <span className="animate-pulse">{loadingStatus}</span> : null}
        </div>
      </div>
    </CardHeader>
  );
}

interface TestQuestionsOnlyViewCardProps {
  topicId: number;
  topicTitle?: string;
  questionCount?: number;
  loadingStatus?: string;
  children: ReactNode;
}

function TestQuestionsOnlyViewCard({
  topicId,
  topicTitle,
  questionCount,
  loadingStatus,
  children,
}: TestQuestionsOnlyViewCardProps) {
  return (
    <Card className={adminClassNames.panel.card}>
      <TestQuestionsOnlyHeader
        topicId={topicId}
        topicTitle={topicTitle}
        questionCount={questionCount}
        loadingStatus={loadingStatus}
      />
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
        <AdminSkeletonRows rows={4} columns={2} label="Загружаем вопросы теста" />
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
    <TestQuestionsOnlyViewCard
      topicId={topicId}
      topicTitle={detail.draft.title}
      questionCount={detail.draft.questions.length}
    >
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
        onMoveUp={questionDnd.handleMoveUp}
        onMoveDown={questionDnd.handleMoveDown}
      />
    </TestQuestionsOnlyViewCard>
  );
}
