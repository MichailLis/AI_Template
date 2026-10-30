import { Trash2 } from 'lucide-react';

import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import type { QuestionOptionDraft } from '../model/types';

interface QuestionModalOptionRowProps {
  option: QuestionOptionDraft;
  index: number;
  canRemove: boolean;
  onUpdateOption: (optionId: string, field: 'label' | 'weight', value: string) => void;
  onRemoveOption: (optionId: string) => void;
}

export function QuestionModalOptionRow({
  option,
  index,
  canRemove,
  onUpdateOption,
  onRemoveOption,
}: QuestionModalOptionRowProps) {
  return (
    <div
      className={`grid gap-2 md:grid-cols-[minmax(0,1fr)_8rem_2.25rem] ${adminClassNames.panel.compactSection}`}
    >
      <Input
        value={option.label}
        onChange={(event) => onUpdateOption(option.id, 'label', event.target.value)}
        placeholder={`Текст варианта ${index + 1}`}
        aria-label={`Текст варианта ${index + 1}`}
      />
      <Input
        type="number"
        step={1}
        value={option.weight}
        onChange={(event) => onUpdateOption(option.id, 'weight', event.target.value)}
        placeholder="Вес (целое)"
        aria-label={`Вес варианта ${index + 1}`}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemoveOption(option.id)}
        disabled={!canRemove}
        aria-label={`Удалить вариант ${index + 1}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
