import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import type { QuestionFormState, QuestionType } from '../model/types';

interface QuestionModalBasicFieldsProps {
  form: QuestionFormState;
  onTypeChange: (type: QuestionType) => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onRequiredChange: (required: boolean) => void;
}

export function QuestionModalBasicFields({
  form,
  onTypeChange,
  onTitleChange,
  onDescriptionChange,
  onRequiredChange,
}: QuestionModalBasicFieldsProps) {
  return (
    <>
      <Label htmlFor="question-type-modal">Тип</Label>
      <select
        id="question-type-modal"
        className={adminClassNames.form.select}
        value={form.type}
        onChange={(event) => onTypeChange(event.target.value as QuestionType)}
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
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Заголовок вопроса"
      />

      <Label htmlFor="question-description-modal">Описание</Label>
      <Textarea
        id="question-description-modal"
        rows={2}
        value={form.description}
        onChange={(event) => onDescriptionChange(event.target.value)}
      />

      <label className={adminClassNames.form.checkboxLabel}>
        <input
          type="checkbox"
          checked={form.required}
          onChange={(event) => onRequiredChange(event.target.checked)}
        />
        Обязательный вопрос
      </label>
    </>
  );
}
