import { useId, type Ref } from 'react';

import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

interface TestsTopicBaseFieldsProps {
  title: string;
  slug: string;
  description: string;
  disabled?: boolean;
  titleLabel?: string;
  /** Текст ошибки у поля названия; без него поле считается корректным. */
  titleError?: string;
  titleInputRef?: Ref<HTMLInputElement>;
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function TestsTopicBaseFields({
  title,
  slug,
  description,
  disabled = false,
  titleLabel = 'Название теста',
  titleError,
  titleInputRef,
  onTitleChange,
  onSlugChange,
  onDescriptionChange,
}: TestsTopicBaseFieldsProps) {
  const titleErrorId = useId();

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-topic-title">{titleLabel}</Label>
        <Input
          id="new-topic-title"
          ref={titleInputRef}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Карьерная ориентация"
          disabled={disabled}
          aria-invalid={titleError ? true : undefined}
          aria-describedby={titleError ? titleErrorId : undefined}
        />
        {titleError ? (
          <p id={titleErrorId} className="text-[0.8rem] font-medium text-destructive">
            {titleError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="new-topic-slug">Slug (служебный, необязательно)</Label>
        <Input
          id="new-topic-slug"
          value={slug}
          onChange={(event) => onSlugChange(event.target.value)}
          placeholder="career-orientation"
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="new-topic-description">Описание (необязательно)</Label>
        <Textarea
          id="new-topic-description"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          rows={3}
          placeholder="Краткое описание для студентов..."
          disabled={disabled}
        />
      </div>
    </>
  );
}
