import { GripVertical, Pencil, Trash2 } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

import { QUESTION_TYPE_LABELS } from '../lib/tests-utils';

import type { TestDraftQuestion } from '../model/types';
import type { DragEvent } from 'react';

type DropPosition = 'before' | 'after';

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

export function QuestionCard({
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
      className={cn(
        'relative transition-all duration-150',
        adminClassNames.panel.card,
        isDragging ? 'scale-[0.99] opacity-60 shadow-sm' : '',
        isDropTarget ? adminClassNames.drag.ring : '',
      )}
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
        <div
          className={`pointer-events-none absolute -top-1 left-3 right-3 h-1 rounded-full ${adminClassNames.drag.indicator}`}
        />
      ) : null}
      {isDropTarget && dropPosition === 'after' ? (
        <div
          className={`pointer-events-none absolute -bottom-1 left-3 right-3 h-1 rounded-full ${adminClassNames.drag.indicator}`}
        />
      ) : null}
      <CardContent className="p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start gap-2">
              <span className={`cursor-grab active:cursor-grabbing ${adminClassNames.text.muted}`}>
                <GripVertical className="h-4 w-4" />
              </span>
              <p className={`min-w-0 text-sm font-semibold ${adminClassNames.text.heading}`}>
                #{question.order} {question.title}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              <Badge variant="outline" className={adminBadgeClassNames.info}>
                {QUESTION_TYPE_LABELS[question.type]}
              </Badge>
              {question.required ? (
                <Badge variant="outline" className={adminBadgeClassNames.warning}>
                  Обязательный
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditQuestion(question)}
              disabled={isReorderingQuestions || isAnyDragging}
            >
              <Pencil className="mr-1 h-4 w-4" />
              Изменить
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={adminClassNames.actionMenu.dangerItem}
              onClick={() => onRequestDeleteQuestion(question)}
              disabled={isDeletingQuestion || isReorderingQuestions || isAnyDragging}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Удалить
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
