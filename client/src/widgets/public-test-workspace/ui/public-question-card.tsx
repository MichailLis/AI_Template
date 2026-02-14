import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

interface PublicQuestionOption {
  id: number;
  label: string;
  value: string;
}

interface PublicQuestionSliderBand {
  minValue: number;
  maxValue: number;
}

interface PublicQuestion {
  id: number;
  type: 'OPEN_TEXT' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'SLIDER';
  title: string;
  description: string | null;
  required: boolean;
  order: number;
  settings: unknown;
  options: PublicQuestionOption[];
  sliderBands: PublicQuestionSliderBand[];
}

interface SliderQuestionMeta {
  min: number;
  max: number;
  step: number;
  value: number;
}

interface PublicQuestionCardProps {
  question: PublicQuestion;
  currentAnswer: unknown;
  onAnswerChange: (questionId: number, value: unknown) => void;
}

const getChoiceOptionClass = (checked: boolean) => {
  return checked ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/30';
};

const getSliderQuestionMeta = (
  settings: unknown,
  sliderBands: PublicQuestionSliderBand[],
  currentAnswer: unknown,
): SliderQuestionMeta => {
  const settingsRecord =
    typeof settings === 'object' && settings !== null
      ? (settings as Record<string, unknown>)
      : null;

  const fallbackMin = sliderBands[0]?.minValue ?? 0;
  const fallbackMax = sliderBands.length > 0 ? sliderBands[sliderBands.length - 1].maxValue : 100;
  const min = typeof settingsRecord?.min === 'number' ? settingsRecord.min : fallbackMin;
  const max = typeof settingsRecord?.max === 'number' ? settingsRecord.max : fallbackMax;
  const step = typeof settingsRecord?.step === 'number' ? settingsRecord.step : 1;
  const value = typeof currentAnswer === 'number' ? currentAnswer : min;

  return {
    min,
    max,
    step,
    value,
  };
};

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
          <div className="space-y-2">
            {question.options.map((option) => {
              const checked = currentAnswer === option.value;

              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${getChoiceOptionClass(checked)}`}
                >
                  <input
                    type="radio"
                    name={`single-${question.id}`}
                    checked={checked}
                    onChange={() => onAnswerChange(question.id, option.value)}
                    className="h-4 w-4 border-border text-primary"
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        ) : null}

        {question.type === 'MULTI_CHOICE' ? (
          <div className="space-y-2">
            {question.options.map((option) => {
              const currentValue = Array.isArray(currentAnswer) ? (currentAnswer as string[]) : [];
              const checked = currentValue.includes(option.value);

              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${getChoiceOptionClass(checked)}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      if (event.target.checked) {
                        onAnswerChange(question.id, [...currentValue, option.value]);
                      } else {
                        onAnswerChange(
                          question.id,
                          currentValue.filter((value) => value !== option.value),
                        );
                      }
                    }}
                    className="h-4 w-4 border-border text-primary"
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        ) : null}

        {question.type === 'SLIDER' ? (
          <div className="space-y-3">
            <Label>{sliderMeta!.value}</Label>
            <input
              type="range"
              min={sliderMeta!.min}
              max={sliderMeta!.max}
              step={sliderMeta!.step}
              value={sliderMeta!.value}
              onChange={(event) =>
                onAnswerChange(question.id, Number.parseInt(event.target.value, 10))
              }
              className="w-full accent-primary"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{sliderMeta!.min}</span>
              <span>{sliderMeta!.max}</span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
