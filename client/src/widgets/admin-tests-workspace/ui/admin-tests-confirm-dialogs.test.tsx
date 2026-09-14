import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminTestsConfirmDialogs } from './admin-tests-confirm-dialogs';

import type { TestTopicListItem } from '@/features/tests';

const createTopic = (overrides: Partial<TestTopicListItem> = {}): TestTopicListItem => ({
  id: 1225,
  slug: 'audit-a',
  description: null,
  draftVersionNumber: 2,
  draftTitle: 'AUDIT-A',
  draftQuestionCount: 3,
  publishedVersionNumber: 1,
  publishedTitle: 'AUDIT-A',
  activePublicLinkCount: 0,
  publicLinkCount: 0,
  attemptCount: 0,
  hasPublishedVersion: true,
  canDelete: false,
  scoringKind: 'DEFAULT',
  hasUnpublishedChanges: false,
  updatedAt: '2026-09-11T10:00:00.000Z',
  ...overrides,
});

const baseProps = {
  isSwitchConfirmOpen: false,
  onConfirmTopicSwitch: vi.fn(),
  onCloseTopicSwitch: vi.fn(),
  isDiscardQuestionConfirmOpen: false,
  onConfirmDiscardQuestion: vi.fn(),
  onCloseDiscardQuestion: vi.fn(),
  pendingDeleteTopic: null,
  isDeletingTopic: false,
  onConfirmDeleteTopic: vi.fn(),
  onCloseDeleteTopic: vi.fn(),
  pendingArchiveTopic: null,
  isArchivingTopic: false,
  onConfirmArchiveTopic: vi.fn(),
  onCloseArchiveTopic: vi.fn(),
  pendingRestoreTopic: null,
  isRestoringTopic: false,
  onConfirmRestoreTopic: vi.fn(),
  onCloseRestoreTopic: vi.fn(),
  pendingDeleteQuestion: null,
  isDeletingQuestion: false,
  onConfirmDeleteQuestion: vi.fn(),
  onCloseDeleteQuestion: vi.fn(),
  isPublishConfirmOpen: false,
  isPublishing: false,
  onConfirmPublish: vi.fn(),
  onClosePublish: vi.fn(),
  isNavigationConfirmOpen: false,
  onConfirmNavigationLeave: vi.fn(),
  onConfirmNavigationStay: vi.fn(),
};

describe('AdminTestsConfirmDialogs archive confirmation', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('states how many active links the archive will close', () => {
    render(
      <AdminTestsConfirmDialogs
        {...baseProps}
        pendingArchiveTopic={createTopic({ activePublicLinkCount: 3 })}
      />,
    );

    expect(
      screen.getByText(/Будут закрыты 3 активные ссылки: участники больше не смогут пройти тест\./),
    ).toBeInTheDocument();
  });

  it('uses the singular form for a single active link', () => {
    render(
      <AdminTestsConfirmDialogs
        {...baseProps}
        pendingArchiveTopic={createTopic({ activePublicLinkCount: 1 })}
      />,
    );

    expect(
      screen.getByText(/Будет закрыта 1 активная ссылка: участники больше не смогут пройти тест\./),
    ).toBeInTheDocument();
  });

  it('says the archive closes no access when the test has no active links', () => {
    render(<AdminTestsConfirmDialogs {...baseProps} pendingArchiveTopic={createTopic()} />);

    expect(
      screen.getByText(/Активных ссылок нет, доступ закрывать не придется\./),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Будут закрыты/)).not.toBeInTheDocument();
  });

  it('tells the restore dialog that the links start working again', () => {
    render(
      <AdminTestsConfirmDialogs
        {...baseProps}
        pendingRestoreTopic={createTopic({ activePublicLinkCount: 2 })}
      />,
    );

    expect(
      screen.getByText(/Снова заработают 2 активные ссылки на этот тест\./),
    ).toBeInTheDocument();
  });

  /**
   * Находка аудита FLOW-04: диалог обещал удалить тест «вместе с опубликованными версиями», хотя
   * сервер такие тесты удалять не дает. Удалить можно только неиспользованный тест.
   */
  it('describes deletion honestly for the only tests that can be deleted', () => {
    render(
      <AdminTestsConfirmDialogs
        {...baseProps}
        pendingDeleteTopic={createTopic({
          canDelete: true,
          hasPublishedVersion: false,
          publishedVersionNumber: null,
        })}
      />,
    );

    expect(
      screen.getByText(
        'Тест "AUDIT-A" будет удален без возможности восстановления. У него нет публикаций, ссылок и прохождений, поэтому ничего больше не пострадает.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/опубликованными версиями/)).not.toBeInTheDocument();
  });
});
