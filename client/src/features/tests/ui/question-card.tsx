import { GripVertical, Pencil, Trash2 } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { adminClassNames } from '@/shared/ui/admin-design-tokens';
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
      <CardContent className="space-y-2 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`cursor-grab active:cursor-grabbing ${adminClassNames.text.muted}`}>
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
