import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';

import { QuestionModalOptionRow } from './question-modal.option-row';

import type { QuestionOptionDraft } from '../model/types';

interface QuestionModalChoiceSectionProps {
  options: QuestionOptionDraft[];
  onAddOption: () => void;
  onUpdateOption: (optionId: string, field: 'label' | 'weight', value: string) => void;
  onRemoveOption: (optionId: string) => void;
}

export function QuestionModalChoiceSection({
  options,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: QuestionModalChoiceSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Варианты ответа</Label>
        <Button type="button" variant="outline" size="sm" onClick={onAddOption}>
          Добавить вариант
        </Button>
      </div>

      <p className={adminClassNames.form.fieldHint}>
        Заполните текст и вес. Вес влияет на итоговый балл.
      </p>

      <div
        className={`hidden items-center gap-2 px-1 text-xs font-medium md:grid md:grid-cols-[minmax(0,1fr)_8rem_2.25rem] ${adminClassNames.text.muted}`}
      >
        <span>Текст варианта</span>
        <span>Вес (целое)</span>
        <span />
      </div>

      <div className="space-y-2">
        {options.map((option, index) => (
          <QuestionModalOptionRow
            key={option.id}
            option={option}
            index={index}
            canRemove={options.length > 2}
            onUpdateOption={onUpdateOption}
            onRemoveOption={onRemoveOption}
          />
        ))}
      </div>
    </div>
  );
}
