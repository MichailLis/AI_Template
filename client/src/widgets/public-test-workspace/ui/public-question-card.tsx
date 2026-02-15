import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Textarea } from '@/shared/ui/textarea';

import { getSliderQuestionMeta } from './public-question-card.utils';
import { PublicQuestionChoiceGroup } from './public-question-choice-group';
import { PublicQuestionSliderField } from './public-question-slider-field';

import type { PublicTestQuestion } from './public-test-run.types';

interface PublicQuestionCardProps {
  question: PublicTestQuestion;
  currentAnswer: unknown;
  onAnswerChange: (questionId: number, value: unknown) => void;
}

export function PublicQuestionCard({
  question,
  currentAnswer,
  onAnswerChange,
}: PublicQuestionCardProps) {
  const sliderMeta =
    question.type === 'SLIDER'
      ? getSliderQuestionMeta(question.settings, question.sliderBands, currentAnswer)
      : null;

  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">
            {question.order}. {question.title}
          </CardTitle>
          {question.required ? <Badge variant="outline">Обязательный</Badge> : null}
        </div>
        {question.description ? <CardDescription>{question.description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {question.type === 'OPEN_TEXT' ? (
          <Textarea
            value={typeof currentAnswer === 'string' ? currentAnswer : ''}
            onChange={(event) => onAnswerChange(question.id, event.target.value)}
            placeholder="Введите ответ"
            className="min-h-28"
          />
        ) : null}

        {question.type === 'SINGLE_CHOICE' ? (
          <PublicQuestionChoiceGroup
            mode="single"
            questionId={question.id}
            options={question.options}
            currentAnswer={currentAnswer}
            onAnswerChange={onAnswerChange}
          />
        ) : null}

        {question.type === 'MULTI_CHOICE' ? (
          <PublicQuestionChoiceGroup
            mode="multi"
            questionId={question.id}
            options={question.options}
            currentAnswer={currentAnswer}
            onAnswerChange={onAnswerChange}
          />
        ) : null}

        {question.type === 'SLIDER' && sliderMeta ? (
          <PublicQuestionSliderField
            questionId={question.id}
            min={sliderMeta.min}
            max={sliderMeta.max}
            step={sliderMeta.step}
            value={sliderMeta.value}
            onAnswerChange={onAnswerChange}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
