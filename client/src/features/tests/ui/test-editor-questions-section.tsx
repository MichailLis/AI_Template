import { adminClassNames, adminToneClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';

import { QuestionCard } from './question-card';

import type { TestDraftQuestion } from '../model/types';
import type { DragEvent } from 'react';

type DropPosition = 'before' | 'after';

interface TestEditorQuestionsSectionProps {
  questions: TestDraftQuestion[];
  isReorderingQuestions: boolean;
  isDeletingQuestion: boolean;
  draggingQuestionId: number | null;
  dropTarget: {
    questionId: number;
    position: DropPosition;
  } | null;
  onCreateQuestion: () => void;
  onDragStart: (questionId: number) => void;
  onDragOver: (questionId: number, event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDrop: (questionId: number) => void;
  onEditQuestion: (question: TestDraftQuestion) => void;
  onRequestDeleteQuestion: (question: TestDraftQuestion) => void;
}

export function TestEditorQuestionsSection({
  questions,
  isReorderingQuestions,
  isDeletingQuestion,
  draggingQuestionId,
  dropTarget,
  onCreateQuestion,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onEditQuestion,
  onRequestDeleteQuestion,
}: TestEditorQuestionsSectionProps) {
  return (
    <>
      <div
        className={`flex flex-wrap items-center justify-between gap-3 pt-4 ${adminClassNames.border.top}`}
      >
        <div>
          <p className="text-sm font-semibold">Вопросы теста</p>
          <p className={adminClassNames.form.fieldHint}>
            Добавляйте и редактируйте вопросы в версии в работе через модальное окно.
          </p>
        </div>
        <Button onClick={onCreateQuestion}>Добавить вопрос</Button>
      </div>

      <div className={`space-y-3 pt-4 ${adminClassNames.border.top}`}>
        <p className="text-sm font-semibold">Вопросы теста (в работе): {questions.length}</p>

        {questions.length > 1 ? (
          <p className={adminClassNames.form.fieldHint}>
            Перетаскивайте карточки за иконку слева. Подсветка покажет точное место вставки.
          </p>
        ) : null}
        {isReorderingQuestions ? (
          <p className={`text-xs ${adminToneClassNames.info.text}`}>
            Сохраняем новый порядок вопросов...
          </p>
        ) : null}

        {questions.length === 0 ? (
          <p className={`text-sm ${adminClassNames.text.muted}`}>
            Пока нет вопросов. Добавьте первый вопрос.
          </p>
        ) : null}

        {questions.map((question) => (
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
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDrop={onDrop}
            onEditQuestion={onEditQuestion}
            onRequestDeleteQuestion={onRequestDeleteQuestion}
          />
        ))}
      </div>
    </>
  );
}
