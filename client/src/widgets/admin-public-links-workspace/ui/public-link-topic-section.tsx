import { Label } from '@/shared/ui/label';

import type { PublicLinkTopicSectionProps } from './public-link-create-card.types';

export function PublicLinkTopicSection({
  topics,
  effectiveSelectedTopicId,
  onSelectTopic,
}: PublicLinkTopicSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="public-topic">Тест</Label>
      <select
        id="public-topic"
        value={effectiveSelectedTopicId > 0 ? String(effectiveSelectedTopicId) : ''}
        onChange={(event) => {
          onSelectTopic(Number.parseInt(event.target.value, 10));
        }}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        disabled={topics.length === 0}
      >
        {topics.length === 0 ? <option value="">Нет доступных тестов</option> : null}
        {topics.map((topic) => (
          <option key={topic.id} value={topic.id}>
            {topic.draftTitle}
          </option>
        ))}
      </select>
    </div>
  );
}
