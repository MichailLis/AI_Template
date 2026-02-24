import { Link } from 'react-router-dom';

import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';

type PublicLinksTab = 'active' | 'archived';

interface TopicOption {
  id: number;
  title: string;
}

interface LinkOption {
  id: number;
  shortCode: string;
}

interface PublicLinksStatsFiltersCardProps {
  publicLinksTab: PublicLinksTab;
  onTabChange: (tab: PublicLinksTab) => void;
  topicOptions: TopicOption[];
  effectiveTopicId: number | null;
  onTopicChange: (topicId: number) => void;
  linksForTopic: LinkOption[];
  effectivePublicLinkId: number | null;
  onPublicLinkChange: (linkId: number) => void;
  linkAttemptsCountById: Map<number, number>;
}

export function PublicLinksStatsFiltersCard({
  publicLinksTab,
  onTabChange,
  topicOptions,
  effectiveTopicId,
  onTopicChange,
  linksForTopic,
  effectivePublicLinkId,
  onPublicLinkChange,
  linkAttemptsCountById,
}: PublicLinksStatsFiltersCardProps) {
  return (
    <Card className="border-slate-200">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-40 space-y-2">
            <Label htmlFor="public-link-scope">Область ссылок</Label>
            <select
              id="public-link-scope"
              value={publicLinksTab}
              onChange={(event) => {
                onTabChange(event.target.value as PublicLinksTab);
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="active">Активные</option>
              <option value="archived">Архив</option>
            </select>
          </div>

          <div className="min-w-64 space-y-2">
            <Label htmlFor="stats-topic-select">Тест (контекст)</Label>
            <select
              id="stats-topic-select"
              value={effectiveTopicId ? String(effectiveTopicId) : ''}
              onChange={(event) => {
                onTopicChange(Number.parseInt(event.target.value, 10));
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={topicOptions.length === 0}
            >
              {topicOptions.length === 0 ? (
                <option value="">Нет доступных тестов в выбранной области</option>
              ) : null}
              {topicOptions.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-64 space-y-2">
            <Label htmlFor="stats-link-select">Публичная ссылка (число попыток)</Label>
            <select
              id="stats-link-select"
              value={effectivePublicLinkId ? String(effectivePublicLinkId) : ''}
              onChange={(event) => {
                onPublicLinkChange(Number.parseInt(event.target.value, 10));
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={linksForTopic.length === 0}
            >
              {linksForTopic.length === 0 ? (
                <option value="">Нет доступных ссылок для выбранного теста</option>
              ) : null}
              {linksForTopic.map((link) => {
                const attemptsCount = linkAttemptsCountById.get(link.id) ?? 0;

                return (
                  <option key={link.id} value={link.id}>
                    {`${link.shortCode} (${attemptsCount})`}
                  </option>
                );
              })}
            </select>
          </div>

          <Button asChild type="button" variant="outline" size="sm" className="md:ml-auto">
            <Link to="/admin/public-links">Вернуться к управлению ссылками</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Сначала выберите область, затем тест и ссылку.
        </p>
      </CardContent>
    </Card>
  );
}
