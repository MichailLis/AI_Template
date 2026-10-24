import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import type { CreateTestValues } from '../model/types';
import type { UseFormReturn } from 'react-hook-form';

interface TestsTopicBaseFieldsProps {
  form: UseFormReturn<CreateTestValues>;
  disabled?: boolean;
  titleLabel?: string;
}

export function TestsTopicBaseFields({
  form,
  disabled = false,
  titleLabel = 'Название теста',
}: TestsTopicBaseFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-topic-title">{titleLabel}</Label>
        <Input
          id="new-topic-title"
          placeholder="Карьерная ориентация"
          disabled={disabled}
          {...form.register('title')}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="new-topic-slug">Slug (служебный, необязательно)</Label>
        <Input
          id="new-topic-slug"
          placeholder="career-orientation"
          disabled={disabled}
          {...form.register('slug')}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="new-topic-description">Описание (необязательно)</Label>
        <Textarea
          id="new-topic-description"
          rows={3}
          placeholder="Краткое описание для студентов..."
          disabled={disabled}
          {...form.register('description')}
        />
      </div>
    </>
  );
}
