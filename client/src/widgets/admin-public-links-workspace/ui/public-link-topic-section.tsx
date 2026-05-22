import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminSelectField } from '@/shared/ui/admin-select-field';
import { Badge } from '@/shared/ui/badge';
import { Label } from '@/shared/ui/label';

import type { PublicLinkTopicSectionProps } from './public-link-create-card.types';

export function PublicLinkTopicSection({
  topics,
  effectiveSelectedTopicId,
  onSelectTopic,
}: PublicLinkTopicSectionProps) {
  return (
    <div className={adminClassNames.panel.compactSection}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={`text-sm font-medium ${adminClassNames.text.heading}`}>Тест</p>
          <p className={`mt-1 text-sm ${adminClassNames.text.body}`}>
            Ссылка будет вести на опубликованную версию выбранного теста.
          </p>
        </div>
        <Badge variant="outline" className={adminBadgeClassNames.info}>
          {topics.length} доступно
        </Badge>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <Label htmlFor="public-topic">Тест для публикации</Label>
        <AdminSelectField
          id="public-topic"
          value={effectiveSelectedTopicId > 0 ? String(effectiveSelectedTopicId) : ''}
          onChange={(event) => {
            onSelectTopic(Number.parseInt(event.target.value, 10));
          }}
          className="flex"
          disabled={topics.length === 0}
        >
          {topics.length === 0 ? <option value="">Нет доступных тестов</option> : null}
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.draftTitle}
            </option>
          ))}
        </AdminSelectField>
      </div>
    </div>
  );
}
