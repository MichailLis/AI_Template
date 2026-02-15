import { Label } from '@/shared/ui/label';

interface PublicQuestionSliderFieldProps {
  questionId: number;
  min: number;
  max: number;
  step: number;
  value: number;
  onAnswerChange: (questionId: number, value: unknown) => void;
}

export function PublicQuestionSliderField({
  questionId,
  min,
  max,
  step,
  value,
  onAnswerChange,
}: PublicQuestionSliderFieldProps) {
  return (
    <div className="space-y-3">
      <Label>{value}</Label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onAnswerChange(questionId, Number.parseInt(event.target.value, 10))}
        className="w-full accent-primary"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
