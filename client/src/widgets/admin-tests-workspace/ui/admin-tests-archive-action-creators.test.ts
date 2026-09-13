import { describe, expect, it, vi } from 'vitest';

import { createHandleToggleTopicActive } from './admin-tests-archive-action-creators';

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
  activePublicLinkCount: 2,
  publicLinkCount: 2,
  attemptCount: 0,
  hasPublishedVersion: true,
  canDelete: false,
  hasUnpublishedChanges: false,
  updatedAt: '2026-09-11T10:00:00.000Z',
  ...overrides,
});

describe('createHandleToggleTopicActive', () => {
  it('asks for confirmation instead of archiving the test straight away', () => {
    const selectedTopic = createTopic();
    const setPendingArchiveTopic = vi.fn();
    const setPendingRestoreTopic = vi.fn();

    const handleToggleTopicActive = createHandleToggleTopicActive({
      selectedTopic,
      setPendingArchiveTopic,
      setPendingRestoreTopic,
    });

    handleToggleTopicActive(false);

    expect(setPendingArchiveTopic).toHaveBeenCalledWith(selectedTopic);
    expect(setPendingRestoreTopic).not.toHaveBeenCalled();
  });

  it('asks for confirmation before restoring the test from the archive', () => {
    const selectedTopic = createTopic();
    const setPendingArchiveTopic = vi.fn();
    const setPendingRestoreTopic = vi.fn();

    const handleToggleTopicActive = createHandleToggleTopicActive({
      selectedTopic,
      setPendingArchiveTopic,
      setPendingRestoreTopic,
    });

    handleToggleTopicActive(true);

    expect(setPendingRestoreTopic).toHaveBeenCalledWith(selectedTopic);
    expect(setPendingArchiveTopic).not.toHaveBeenCalled();
  });

  it('does nothing while the selected test is still loading', () => {
    const setPendingArchiveTopic = vi.fn();
    const setPendingRestoreTopic = vi.fn();

    const handleToggleTopicActive = createHandleToggleTopicActive({
      selectedTopic: null,
      setPendingArchiveTopic,
      setPendingRestoreTopic,
    });

    handleToggleTopicActive(false);

    expect(setPendingArchiveTopic).not.toHaveBeenCalled();
    expect(setPendingRestoreTopic).not.toHaveBeenCalled();
  });
});
