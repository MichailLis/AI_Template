import { useMemo } from 'react';

import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import { TestsSidebarCreateForm } from './tests-sidebar-create-form';
import { TestsSidebarSearchSection } from './tests-sidebar-search-section';
import { TestsSidebarTopicsList } from './tests-sidebar-topics-list';

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
    <Card className={adminClassNames.panel.card}>
      <CardHeader>
        <CardTitle>Тесты</CardTitle>
        <CardDescription>Создание и управление тестами.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <TestsSidebarCreateForm
          newTestTitle={newTestTitle}
          newTestSlug={newTestSlug}
          newTestDescription={newTestDescription}
          isCreating={isCreating}
          isCreatingWithAi={isCreatingWithAi}
          onNewTestTitleChange={onNewTestTitleChange}
          onNewTestSlugChange={onNewTestSlugChange}
          onNewTestDescriptionChange={onNewTestDescriptionChange}
          onCreateTest={onCreateTest}
          onOpenAiGenerator={onOpenAiGenerator}
        />

        <TestsSidebarSearchSection searchValue={searchValue} onSearchChange={onSearchChange} />

        <TestsSidebarTopicsList
          filteredTopics={filteredTopics}
          selectedTopicId={selectedTopicId}
          topicsLoading={topicsLoading}
          topicsError={topicsError}
          topicsErrorMessage={topicsErrorMessage}
          isDeletingTopic={isDeletingTopic}
          deletingTopicId={deletingTopicId}
          onSelectTest={onSelectTest}
          onRequestDeleteTest={onRequestDeleteTest}
          onRetryTopics={onRetryTopics}
        />
      </CardContent>
    </Card>
  );
}
