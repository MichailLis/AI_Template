import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import { QuestionModalSliderBandRow } from './question-modal.slider-band-row';

import type { QuestionSliderBandDraft } from '../model/types';

interface QuestionModalSliderSectionProps {
  sliderMin: string;
  sliderMax: string;
  sliderStep: string;
  sliderBands: QuestionSliderBandDraft[];
  onUpdateSliderScale: (field: 'sliderMin' | 'sliderMax' | 'sliderStep', value: string) => void;
  onAddSliderBand: () => void;
  onUpdateSliderBand: (
    bandId: string,
    field: 'minValue' | 'maxValue' | 'label' | 'weight',
    value: string,
  ) => void;
  onRemoveSliderBand: (bandId: string) => void;
}

export function QuestionModalSliderSection({
  sliderMin,
  sliderMax,
  sliderStep,
  sliderBands,
  onUpdateSliderScale,
  onAddSliderBand,
  onUpdateSliderBand,
  onRemoveSliderBand,
}: QuestionModalSliderSectionProps) {
  return (
    <div className="space-y-3">
      <div className={`space-y-3 ${adminClassNames.panel.compactSection}`}>
        <div>
          <Label className={`text-sm font-medium ${adminClassNames.text.body}`}>
            Шкала слайдера
          </Label>
          <p className={`mt-1 ${adminClassNames.form.fieldHint}`}>
            Эти значения задают сам ползунок. Подписи ниже показываются участнику, когда оценка
            попадает в диапазон.
          </p>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          <div className="space-y-1">
            <Label className={`text-xs ${adminClassNames.text.body}`} htmlFor="slider-scale-min">
              Минимум
            </Label>
            <Input
              id="slider-scale-min"
              type="number"
              step={1}
              value={sliderMin}
              onChange={(event) => onUpdateSliderScale('sliderMin', event.target.value)}
              placeholder="1"
            />
          </div>

          <div className="space-y-1">
            <Label className={`text-xs ${adminClassNames.text.body}`} htmlFor="slider-scale-max">
              Максимум
            </Label>
            <Input
              id="slider-scale-max"
              type="number"
              step={1}
              value={sliderMax}
              onChange={(event) => onUpdateSliderScale('sliderMax', event.target.value)}
              placeholder="10"
            />
          </div>

          <div className="space-y-1">
            <Label className={`text-xs ${adminClassNames.text.body}`} htmlFor="slider-scale-step">
              Шаг
            </Label>
            <Input
              id="slider-scale-step"
              type="number"
              step={1}
              min={1}
              value={sliderStep}
              onChange={(event) => onUpdateSliderScale('sliderStep', event.target.value)}
              placeholder="1"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label>Подписи и веса диапазонов</Label>
          <p className={`mt-1 ${adminClassNames.form.fieldHint}`}>
            Например: 1-3 {'->'} низкий комфорт, 4-7 {'->'} средний, 8-10 {'->'} высокий.
          </p>
        </div>
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
