import { Trash2 } from 'lucide-react';
import { useMemo } from 'react';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import type { TestTopicListItem } from '../model/types';

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
  isCreatingWithAi: boolean;
  isDeletingTopic: boolean;
  deletingTopicId: number | null;
  onNewTestTitleChange: (value: string) => void;
  onNewTestSlugChange: (value: string) => void;
  onNewTestDescriptionChange: (value: string) => void;
  onCreateTest: () => void;
  onOpenAiGenerator: () => void;
  onRequestDeleteTest: (topic: TestTopicListItem) => void;
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
  isCreatingWithAi,
  isDeletingTopic,
  deletingTopicId,
  onNewTestTitleChange,
  onNewTestSlugChange,
  onNewTestDescriptionChange,
  onCreateTest,
  onOpenAiGenerator,
  onRequestDeleteTest,
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
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={onOpenAiGenerator}
            disabled={isCreatingWithAi}
          >
            {isCreatingWithAi ? 'Создание теста...' : 'Создать тест с ИИ'}
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
            <div key={topic.id} className="relative">
              <Button
                variant={selectedTopicId === topic.id ? 'secondary' : 'outline'}
                className="h-auto w-full items-start justify-start whitespace-normal pr-10"
                onClick={() => onSelectTest(topic.id)}
              >
                <div className="min-w-0 w-full space-y-1 text-left">
                  <p className="break-words text-sm font-semibold leading-snug">
                    {topic.draftTitle}
                  </p>
                  <p className="break-all text-xs text-slate-500">{topic.slug}</p>
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

              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1 h-7 w-7 text-slate-500 hover:text-red-600"
                onClick={() => onRequestDeleteTest(topic)}
                disabled={isDeletingTopic && deletingTopicId === topic.id}
                aria-label={`Удалить тест ${topic.draftTitle}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
