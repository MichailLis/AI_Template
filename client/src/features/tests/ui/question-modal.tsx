import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

import { isChoiceType } from '../lib/tests-utils';

import { QuestionModalBasicFields } from './question-modal-basic-fields';
import { QuestionModalChoiceSection } from './question-modal-choice-section';
import { QuestionModalSettingsSection } from './question-modal-settings-section';
import { QuestionModalSliderSection } from './question-modal-slider-section';
import {
  getQuestionModalSubmitLabel,
  withAddedOption,
  withAddedSliderBand,
  withRemovedOption,
  withRemovedSliderBand,
  withUpdatedOption,
  withUpdatedQuestionType,
  withUpdatedSliderBand,
} from './question-modal.form';

import type { QuestionFormState, QuestionType } from '../model/types';

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
  const submitLabel = getQuestionModalSubmitLabel(mode, isSubmitting);

  const setType = (type: QuestionType) => {
    onFormChange(withUpdatedQuestionType(form, type));
  };

  const updateOption = (optionId: string, field: 'label' | 'weight', value: string) => {
    onFormChange(withUpdatedOption(form, optionId, field, value));
  };

  const addOption = () => {
    onFormChange(withAddedOption(form));
  };

  const removeOption = (optionId: string) => {
    onFormChange(withRemovedOption(form, optionId));
  };

  const updateSliderBand = (
    bandId: string,
    field: 'minValue' | 'maxValue' | 'label' | 'weight',
    value: string,
  ) => {
    onFormChange(withUpdatedSliderBand(form, bandId, field, value));
  };

  const addSliderBand = () => {
    onFormChange(withAddedSliderBand(form));
  };

  const removeSliderBand = (bandId: string) => {
    onFormChange(withRemovedSliderBand(form, bandId));
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
          <QuestionModalBasicFields
            form={form}
            onTypeChange={setType}
            onTitleChange={(title) => onFormChange({ ...form, title })}
            onDescriptionChange={(description) => onFormChange({ ...form, description })}
            onRequiredChange={(required) => onFormChange({ ...form, required })}
          />

          <QuestionModalSettingsSection
            settingsText={form.settingsText}
            onSettingsTextChange={(settingsText) => onFormChange({ ...form, settingsText })}
          />

          {isChoiceType(form.type) ? (
            <QuestionModalChoiceSection
              options={form.options}
              onAddOption={addOption}
              onUpdateOption={updateOption}
              onRemoveOption={removeOption}
            />
          ) : null}

          {form.type === 'SLIDER' ? (
            <QuestionModalSliderSection
              sliderBands={form.sliderBands}
              onAddSliderBand={addSliderBand}
              onUpdateSliderBand={updateSliderBand}
              onRemoveSliderBand={removeSliderBand}
            />
          ) : null}

          {submitError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={onSubmit} disabled={isSubmitting}>
              {submitLabel}
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
