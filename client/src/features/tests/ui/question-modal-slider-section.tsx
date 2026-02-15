import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';

import { QuestionModalSliderBandRow } from './question-modal.slider-band-row';

import type { QuestionSliderBandDraft } from '../model/types';

interface QuestionModalSliderSectionProps {
  sliderBands: QuestionSliderBandDraft[];
  onAddSliderBand: () => void;
  onUpdateSliderBand: (
    bandId: string,
    field: 'minValue' | 'maxValue' | 'label' | 'weight',
    value: string,
  ) => void;
  onRemoveSliderBand: (bandId: string) => void;
}

export function QuestionModalSliderSection({
  sliderBands,
  onAddSliderBand,
  onUpdateSliderBand,
  onRemoveSliderBand,
}: QuestionModalSliderSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Диапазоны слайдера</Label>
        <Button type="button" variant="outline" size="sm" onClick={onAddSliderBand}>
          Добавить диапазон
        </Button>
      </div>

      <div className="space-y-2">
        {sliderBands.map((band, index) => (
          <QuestionModalSliderBandRow
            key={band.id}
            band={band}
            index={index}
            canRemove={sliderBands.length > 1}
            onUpdateSliderBand={onUpdateSliderBand}
            onRemoveSliderBand={onRemoveSliderBand}
          />
        ))}
      </div>
    </div>
  );
}
