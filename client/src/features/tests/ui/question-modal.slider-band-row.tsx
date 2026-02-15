import { Trash2 } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import type { QuestionSliderBandDraft } from '../model/types';

interface QuestionModalSliderBandRowProps {
  band: QuestionSliderBandDraft;
  index: number;
  canRemove: boolean;
  onUpdateSliderBand: (
    bandId: string,
    field: 'minValue' | 'maxValue' | 'label' | 'weight',
    value: string,
  ) => void;
  onRemoveSliderBand: (bandId: string) => void;
}

export function QuestionModalSliderBandRow({
  band,
  index,
  canRemove,
  onUpdateSliderBand,
  onRemoveSliderBand,
}: QuestionModalSliderBandRowProps) {
  return (
    <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-2 md:grid-cols-[8rem_8rem_minmax(0,1fr)_8rem_2.25rem]">
      <Input
        type="number"
        step={1}
        value={band.minValue}
        onChange={(event) => onUpdateSliderBand(band.id, 'minValue', event.target.value)}
        placeholder="Мин"
      />
      <Input
        type="number"
        step={1}
        value={band.maxValue}
        onChange={(event) => onUpdateSliderBand(band.id, 'maxValue', event.target.value)}
        placeholder="Макс"
      />
      <Input
        value={band.label}
        onChange={(event) => onUpdateSliderBand(band.id, 'label', event.target.value)}
        placeholder={`Название диапазона ${index + 1}`}
      />
      <Input
        type="number"
        step={1}
        value={band.weight}
        onChange={(event) => onUpdateSliderBand(band.id, 'weight', event.target.value)}
        placeholder="Вес (целое)"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemoveSliderBand(band.id)}
        disabled={!canRemove}
        aria-label={`Удалить диапазон ${index + 1}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
