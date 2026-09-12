import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminTestsConfirmDialogs } from './admin-tests-confirm-dialogs';

import type { TestTopicListItem } from '@/features/tests';

const createTopic = (overrides: Partial<TestTopicListItem> = {}): TestTopicListItem => ({
  id: 1225,
  slug: 'audit-a',
  draftVersionNumber: 2,
  draftTitle: 'AUDIT-A',
  draftQuestionCount: 3,
  publishedVersionNumber: 1,
  publishedTitle: 'AUDIT-A',
  activePublicLinkCount: 0,
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
});
