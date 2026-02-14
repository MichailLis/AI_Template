import { Trash2 } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import { createEmptyOptionDraft, createEmptySliderBandDraft, isChoiceType } from './utils';

import type { QuestionFormState, QuestionType } from './types';

interface QuestionModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  form: QuestionFormState;
  submitError: string | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  onRequestClose: () => void;
  onFormChange: (nextForm: QuestionFormState) => void;
}

export function QuestionModal({
  open,
  mode,
  form,
  submitError,
  isSubmitting,
  onSubmit,
  onRequestClose,
  onFormChange,
}: QuestionModalProps) {
  const setType = (type: QuestionType) => {
    let nextOptions = form.options;
    let nextSliderBands = form.sliderBands;

    if (isChoiceType(type) && nextOptions.length === 0) {
      nextOptions = [createEmptyOptionDraft(), createEmptyOptionDraft()];
    }

    if (type === 'SLIDER' && nextSliderBands.length === 0) {
      nextSliderBands = [createEmptySliderBandDraft()];
    }

    onFormChange({
      ...form,
      type,
      options: nextOptions,
      sliderBands: nextSliderBands,
    });
  };

  const updateOption = (optionId: string, field: 'label' | 'weight', value: string) => {
    onFormChange({
      ...form,
      options: form.options.map((option) =>
        option.id === optionId ? { ...option, [field]: value } : option,
      ),
    });
  };

  const addOption = () => {
    onFormChange({
      ...form,
      options: [...form.options, createEmptyOptionDraft()],
    });
  };

  const removeOption = (optionId: string) => {
    if (form.options.length <= 2) {
      return;
    }

    onFormChange({
      ...form,
      options: form.options.filter((option) => option.id !== optionId),
    });
  };

  const updateSliderBand = (
    bandId: string,
    field: 'minValue' | 'maxValue' | 'label' | 'weight',
    value: string,
  ) => {
    onFormChange({
      ...form,
      sliderBands: form.sliderBands.map((band) =>
        band.id === bandId ? { ...band, [field]: value } : band,
      ),
    });
  };

  const addSliderBand = () => {
    onFormChange({
      ...form,
      sliderBands: [...form.sliderBands, createEmptySliderBandDraft()],
    });
  };

  const removeSliderBand = (bandId: string) => {
    if (form.sliderBands.length <= 1) {
      return;
    }

    onFormChange({
      ...form,
      sliderBands: form.sliderBands.filter((band) => band.id !== bandId),
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onRequestClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto border-slate-200">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Изменить вопрос' : 'Добавить вопрос'}</DialogTitle>
          <DialogDescription>
            Заполните поля и сохраните изменения. Вопрос попадет в версию теста в работе.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label htmlFor="question-type-modal">Тип</Label>
          <select
            id="question-type-modal"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.type}
            onChange={(event) => setType(event.target.value as QuestionType)}
          >
            <option value="OPEN_TEXT">Открытый текст</option>
            <option value="SINGLE_CHOICE">Один вариант</option>
            <option value="MULTI_CHOICE">Несколько вариантов</option>
            <option value="SLIDER">Слайдер</option>
          </select>

          <Label htmlFor="question-title-modal">Заголовок</Label>
          <Input
            id="question-title-modal"
            value={form.title}
            onChange={(event) => onFormChange({ ...form, title: event.target.value })}
            placeholder="Заголовок вопроса"
            autoFocus
          />

          <Label htmlFor="question-description-modal">Описание</Label>
          <Textarea
            id="question-description-modal"
            rows={2}
            value={form.description}
            onChange={(event) => onFormChange({ ...form, description: event.target.value })}
          />

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.required}
              onChange={(event) => onFormChange({ ...form, required: event.target.checked })}
            />
            Обязательный вопрос
          </label>

          <details className="rounded-md border border-slate-200 bg-slate-50">
            <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-slate-700">
              Расширенные настройки
            </summary>
            <div className="space-y-2 border-t border-slate-200 p-3">
              <Label htmlFor="question-settings-modal">Настройки JSON (необязательно)</Label>
              <Textarea
                id="question-settings-modal"
                rows={4}
                placeholder='{"min":0,"max":10,"step":1}'
                value={form.settingsText}
                onChange={(event) => onFormChange({ ...form, settingsText: event.target.value })}
              />
              <p className="text-xs text-slate-500">
                Используйте только для редких дополнительных параметров вопроса.
              </p>
            </div>
          </details>

          {isChoiceType(form.type) ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>Варианты ответа</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  Добавить вариант
                </Button>
              </div>

              <p className="text-xs text-slate-500">
                Заполните текст и вес. Вес влияет на итоговый балл.
              </p>

              <div className="hidden items-center gap-2 px-1 text-xs font-medium text-slate-500 md:grid md:grid-cols-[minmax(0,1fr)_8rem_2.25rem]">
                <span>Текст варианта</span>
                <span>Вес (целое)</span>
                <span />
              </div>

              <div className="space-y-2">
                {form.options.map((option, index) => (
                  <div
                    key={option.id}
                    className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-2 md:grid-cols-[minmax(0,1fr)_8rem_2.25rem]"
                  >
                    <Input
                      value={option.label}
                      onChange={(event) => updateOption(option.id, 'label', event.target.value)}
                      placeholder={`Текст варианта ${index + 1}`}
                      aria-label={`Текст варианта ${index + 1}`}
                    />
                    <Input
                      type="number"
                      step={1}
                      value={option.weight}
                      onChange={(event) => updateOption(option.id, 'weight', event.target.value)}
                      placeholder="Вес (целое)"
                      aria-label={`Вес варианта ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(option.id)}
                      disabled={form.options.length <= 2}
                      aria-label={`Удалить вариант ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {form.type === 'SLIDER' ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>Диапазоны слайдера</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSliderBand}>
                  Добавить диапазон
                </Button>
              </div>

              <div className="space-y-2">
                {form.sliderBands.map((band, index) => (
                  <div
                    key={band.id}
                    className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-2 md:grid-cols-[8rem_8rem_minmax(0,1fr)_8rem_2.25rem]"
                  >
                    <Input
                      type="number"
                      step={1}
                      value={band.minValue}
                      onChange={(event) =>
                        updateSliderBand(band.id, 'minValue', event.target.value)
                      }
                      placeholder="Мин"
                    />
                    <Input
                      type="number"
                      step={1}
                      value={band.maxValue}
                      onChange={(event) =>
                        updateSliderBand(band.id, 'maxValue', event.target.value)
                      }
                      placeholder="Макс"
                    />
                    <Input
                      value={band.label}
                      onChange={(event) => updateSliderBand(band.id, 'label', event.target.value)}
                      placeholder={`Название диапазона ${index + 1}`}
                    />
                    <Input
                      type="number"
                      step={1}
                      value={band.weight}
                      onChange={(event) => updateSliderBand(band.id, 'weight', event.target.value)}
                      placeholder="Вес (целое)"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSliderBand(band.id)}
                      disabled={form.sliderBands.length <= 1}
                      aria-label={`Удалить диапазон ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {submitError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? 'Сохранение...'
                : mode === 'edit'
                  ? 'Обновить вопрос'
                  : 'Добавить вопрос'}
            </Button>
            <Button variant="outline" onClick={onRequestClose} disabled={isSubmitting}>
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
