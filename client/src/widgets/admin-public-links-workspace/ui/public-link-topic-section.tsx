import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Label } from '@/shared/ui/label';

import type { PublicLinkTopicSectionProps } from './public-link-create-card.types';

export function PublicLinkTopicSection({
  topics,
  effectiveSelectedTopicId,
  onSelectTopic,
}: PublicLinkTopicSectionProps) {
  return (
    <div className={adminClassNames.panel.compactSection}>
      <p className={`text-sm font-medium ${adminClassNames.text.heading}`}>Тест</p>
      <p className={`mt-1 text-sm ${adminClassNames.text.body}`}>
        Ссылка будет вести на опубликованную версию выбранного теста.
      </p>
      <div className="mt-3 space-y-2">
        <Label htmlFor="public-topic">Тест для публикации</Label>
        <select
          id="public-topic"
          value={effectiveSelectedTopicId > 0 ? String(effectiveSelectedTopicId) : ''}
          onChange={(event) => {
            onSelectTopic(Number.parseInt(event.target.value, 10));
          }}
          className={`flex ${adminClassNames.form.select}`}
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
    </div>
  );
}
