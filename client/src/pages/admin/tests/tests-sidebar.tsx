import { useMemo } from 'react';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import type { TestTopicListItem } from './types';

interface TestsSidebarProps {
  topics: TestTopicListItem[];
  selectedTopicId: number | null;
  topicsLoading: boolean;
  topicsError: boolean;
  topicsErrorMessage?: string | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  newTestTitle: string;
  newTestSlug: string;
  newTestDescription: string;
  isCreating: boolean;
  onNewTestTitleChange: (value: string) => void;
  onNewTestSlugChange: (value: string) => void;
  onNewTestDescriptionChange: (value: string) => void;
  onCreateTest: () => void;
  onSelectTest: (topicId: number) => void;
  onRetryTopics: () => void;
}

export function TestsSidebar({
  topics,
  selectedTopicId,
  topicsLoading,
  topicsError,
  topicsErrorMessage,
  searchValue,
  onSearchChange,
  newTestTitle,
  newTestSlug,
  newTestDescription,
  isCreating,
  onNewTestTitleChange,
  onNewTestSlugChange,
  onNewTestDescriptionChange,
  onCreateTest,
  onSelectTest,
  onRetryTopics,
}: TestsSidebarProps) {
  const filteredTopics = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return topics;
    }

    return topics.filter((topic) => {
      return (
        topic.draftTitle.toLowerCase().includes(query) ||
        topic.slug.toLowerCase().includes(query) ||
        (topic.publishedTitle ?? '').toLowerCase().includes(query)
      );
    });
  }, [searchValue, topics]);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Тесты</CardTitle>
        <CardDescription>Создание и управление тестами.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-topic-title">Название теста</Label>
          <Input
            id="new-topic-title"
            value={newTestTitle}
            onChange={(event) => onNewTestTitleChange(event.target.value)}
            placeholder="Профориентация"
          />

          <Label htmlFor="new-topic-slug">Slug (служебный, необязательно)</Label>
          <Input
            id="new-topic-slug"
            value={newTestSlug}
            onChange={(event) => onNewTestSlugChange(event.target.value)}
            placeholder="career-orientation"
          />

          <Label htmlFor="new-topic-description">Описание (необязательно)</Label>
          <Textarea
            id="new-topic-description"
            value={newTestDescription}
            onChange={(event) => onNewTestDescriptionChange(event.target.value)}
            rows={3}
          />

          <Button className="w-full" onClick={onCreateTest} disabled={isCreating}>
            {isCreating ? 'Создание теста...' : 'Создать тест'}
          </Button>
        </div>

        <div className="space-y-2 border-t border-slate-200 pt-4">
          <Label htmlFor="tests-search">Поиск теста</Label>
          <Input
            id="tests-search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Название или slug"
          />
        </div>

        <div className="space-y-2 border-t border-slate-200 pt-4">
          {topicsLoading ? <p className="text-sm text-slate-500">Загрузка тестов...</p> : null}
          {topicsError ? (
            <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">
                {topicsErrorMessage ?? 'Не удалось загрузить тесты.'}
              </p>
              <Button type="button" size="sm" variant="outline" onClick={onRetryTopics}>
                Повторить
              </Button>
            </div>
          ) : null}

          {!topicsLoading && !topicsError && filteredTopics.length === 0 ? (
            <p className="text-sm text-slate-500">Ничего не найдено по текущему фильтру.</p>
          ) : null}

          {filteredTopics.map((topic) => (
            <Button
              key={topic.id}
              variant={selectedTopicId === topic.id ? 'secondary' : 'outline'}
              className="h-auto w-full justify-start"
              onClick={() => onSelectTest(topic.id)}
            >
              <div className="w-full space-y-1 text-left">
                <p className="text-sm font-semibold">{topic.draftTitle}</p>
                <p className="text-xs text-slate-500">{topic.slug}</p>
                <div className="flex flex-wrap items-center gap-1">
                  <Badge variant="outline">В работе v{topic.draftVersionNumber}</Badge>
                  <Badge variant="outline">
                    {topic.publishedVersionNumber
                      ? `Опубликован v${topic.publishedVersionNumber}`
                      : 'Не опубликован'}
                  </Badge>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
