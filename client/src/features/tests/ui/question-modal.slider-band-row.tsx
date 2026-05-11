import { Trash2 } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

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
  const fieldPrefix = `slider-band-${band.id}`;

  return (
    <div className="grid items-end gap-2 rounded-md border border-slate-200 bg-slate-50 p-2 md:grid-cols-[6rem_6rem_minmax(0,1fr)_6rem_2.25rem]">
      <div className="space-y-1">
        <Label className="text-xs text-slate-600" htmlFor={`${fieldPrefix}-min`}>
          От
        </Label>
        <Input
          id={`${fieldPrefix}-min`}
          type="number"
          step={1}
          value={band.minValue}
          onChange={(event) => onUpdateSliderBand(band.id, 'minValue', event.target.value)}
          placeholder="1"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-slate-600" htmlFor={`${fieldPrefix}-max`}>
          До
        </Label>
        <Input
          id={`${fieldPrefix}-max`}
          type="number"
          step={1}
          value={band.maxValue}
          onChange={(event) => onUpdateSliderBand(band.id, 'maxValue', event.target.value)}
          placeholder="3"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-slate-600" htmlFor={`${fieldPrefix}-label`}>
          Подпись на экране
        </Label>
        <Input
          id={`${fieldPrefix}-label`}
          value={band.label}
          onChange={(event) => onUpdateSliderBand(band.id, 'label', event.target.value)}
          placeholder="Например: низкий комфорт"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-slate-600" htmlFor={`${fieldPrefix}-weight`}>
          Вес
        </Label>
        <Input
          id={`${fieldPrefix}-weight`}
          type="number"
          step={1}
          value={band.weight}
          onChange={(event) => onUpdateSliderBand(band.id, 'weight', event.target.value)}
          placeholder="Вес (целое)"
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemoveSliderBand(band.id)}
        disabled={!canRemove}
        aria-label={`Удалить диапазон ${index + 1}`}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
