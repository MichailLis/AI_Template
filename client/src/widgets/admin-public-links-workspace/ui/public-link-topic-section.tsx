import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminSelectField } from '@/shared/ui/admin-select-field';
import { Badge } from '@/shared/ui/badge';
import { Label } from '@/shared/ui/label';

import type { PublicLinkTopicSectionProps } from './public-link-create-card.types';

/**
 * Опубликованные тесты идут первыми: по ним ссылку можно создать сразу. Остальные вынесены в группу
 * «Нужно опубликовать», а бейдж считает только опубликованные — раньше «10 доступно» включало и их.
 */
export function PublicLinkTopicSection({
  topics,
  effectiveSelectedTopicId,
  onSelectTopic,
}: PublicLinkTopicSectionProps) {
  const publishedTopics = topics.filter((topic) => topic.publishedVersionNumber !== null);
  const unpublishedTopics = topics.filter((topic) => topic.publishedVersionNumber === null);

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
          {publishedTopics.length} опубликовано
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
          {publishedTopics.length > 0 ? (
            <optgroup label="Опубликованные">
              {publishedTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.draftTitle}
                </option>
              ))}
            </optgroup>
          ) : null}
          {unpublishedTopics.length > 0 ? (
            <optgroup label="Нужно опубликовать">
              {unpublishedTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.draftTitle}
                </option>
              ))}
            </optgroup>
          ) : null}
        </AdminSelectField>
      </div>
    </div>
  );
}
