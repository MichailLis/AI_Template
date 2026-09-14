import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TestsListCard } from './tests-list-card';

import type { TestTopicListItem } from '../model/types';
import type { ComponentProps } from 'react';

const createTopic = (overrides: Partial<TestTopicListItem> = {}): TestTopicListItem => ({
  id: 1,
  slug: 'prof-orientation-v3-plus',
  description: 'Методика V3+ для 9–11 классов',
  draftVersionNumber: 2,
  draftTitle: 'Профориентационный тест v3+',
  draftQuestionCount: 21,
  publishedVersionNumber: 1,
  publishedTitle: 'Профориентационный тест v3+',
  activePublicLinkCount: 2,
  publicLinkCount: 3,
  attemptCount: 13,
  hasPublishedVersion: true,
  canDelete: false,
  scoringKind: 'DEFAULT',
  hasUnpublishedChanges: false,
  updatedAt: '2026-06-16T01:00:00.000Z',
  ...overrides,
});

const renderList = (
  topics: TestTopicListItem[],
  overrides: Partial<ComponentProps<typeof TestsListCard>> = {},
) =>
  render(
    <TestsListCard
      topics={topics}
      listMode="active"
      topicsLoading={false}
      topicsError={false}
      searchValue=""
      isArchivingTopic={false}
      archivingTopicId={null}
      isRestoringTopic={false}
      restoringTopicId={null}
      isDeletingTopic={false}
      deletingTopicId={null}
      onSelectTest={vi.fn()}
      onOpenSettings={vi.fn()}
      onRequestArchiveTest={vi.fn()}
      onRequestRestoreTest={vi.fn()}
      onRequestDeleteTest={vi.fn()}
      onRetryTopics={vi.fn()}
      {...overrides}
    />,
  );

/**
 * Находка аудита UX-03: пять строк «Профориентационный тест v3+» отличались только временем
 * обновления, а «Черновик v2» стоял у каждого опубликованного теста, даже без правок.
 */
describe('TestsListCard row', () => {
  afterEach(() => {
    cleanup();
  });

  it('tells same-named tests apart by slug, description, links and attempts', () => {
    renderList([createTopic()]);

    expect(screen.getByText('prof-orientation-v3-plus')).toBeInTheDocument();
    expect(screen.getByText('Методика V3+ для 9–11 классов')).toBeInTheDocument();
    expect(screen.getByText('Активных ссылок: 2')).toBeInTheDocument();
    expect(screen.getByText('Прохождений: 13')).toBeInTheDocument();
  });

  /**
   * Найдено визуальной проверкой: у пяти одноименных тестов v3+ одинаковое описание, поэтому
   * описание вместо slug их не различало. Slug уникален и показывается всегда.
   */
  it('shows the slug even when same-named tests share a description', () => {
    renderList([
      createTopic({ id: 1, slug: 'prof-orientation-v3-plus' }),
      createTopic({ id: 2, slug: 'prof-orientation-v3-plus-2' }),
    ]);

    expect(screen.getByText('prof-orientation-v3-plus')).toBeInTheDocument();
    expect(screen.getByText('prof-orientation-v3-plus-2')).toBeInTheDocument();
  });

  it('shows only the slug when the test has no description', () => {
    renderList([createTopic({ description: null })]);

    expect(screen.getByText('prof-orientation-v3-plus')).toBeInTheDocument();
    expect(screen.queryByText('Методика V3+ для 9–11 классов')).not.toBeInTheDocument();
  });

  it('does not claim a draft is in progress when nothing changed after publishing', () => {
    renderList([createTopic({ hasUnpublishedChanges: false })]);

    expect(screen.queryByText(/Черновик v/)).not.toBeInTheDocument();
    expect(screen.queryByText('Есть неопубликованные изменения')).not.toBeInTheDocument();
  });

  it('flags a published test whose draft really differs', () => {
    renderList([createTopic({ hasUnpublishedChanges: true })]);

    expect(screen.getByText('Есть неопубликованные изменения')).toBeInTheDocument();
  });

  it('finds a test by its slug', () => {
    renderList(
      [
        createTopic({ id: 1, slug: 'prof-orientation-v3-plus' }),
        createTopic({ id: 2, slug: 'prof-orientation-v3-plus-2', description: 'Пилот в лицее' }),
      ],
      { searchValue: 'plus-2' },
    );

    expect(screen.getByText('Пилот в лицее')).toBeInTheDocument();
    expect(screen.queryByText('Методика V3+ для 9–11 классов')).not.toBeInTheDocument();
  });
});

/**
 * Находка аудита FLOW-04: «Удалить навсегда» предлагалось любому архивному тесту, после двух
 * подтверждений сервер отказывал тестам с публикацией, ссылками или прохождениями.
 */
describe('TestsListCard deletion from the archive', () => {
  afterEach(() => {
    cleanup();
  });

  it('explains why a test that was used cannot be deleted', async () => {
    const user = userEvent.setup();
    renderList([createTopic({ canDelete: false, publicLinkCount: 2, attemptCount: 7 })], {
      listMode: 'archived',
    });

    await user.click(screen.getByRole('button', { name: 'Действия' }));

    expect(screen.getByRole('button', { name: /Удалить навсегда/ })).toBeDisabled();
    expect(
      screen.getByText(
        'Нельзя удалить: опубликован, 2 ссылки, 7 прохождений. Тест можно только держать в архиве.',
      ),
    ).toBeInTheDocument();
  });

  it('asks for a single confirmation to delete an unused test', async () => {
    const user = userEvent.setup();
    const onRequestDeleteTest = vi.fn();
    const unusedTopic = createTopic({
      canDelete: true,
      hasPublishedVersion: false,
      publishedVersionNumber: null,
      publicLinkCount: 0,
      activePublicLinkCount: 0,
      attemptCount: 0,
    });
    renderList([unusedTopic], { listMode: 'archived', onRequestDeleteTest });

    await user.click(screen.getByRole('button', { name: 'Действия' }));
    await user.click(screen.getByRole('button', { name: /Удалить навсегда/ }));

    expect(onRequestDeleteTest).toHaveBeenCalledWith(unusedTopic);
    expect(screen.queryByText('Подтвердить удаление')).not.toBeInTheDocument();
  });
});
