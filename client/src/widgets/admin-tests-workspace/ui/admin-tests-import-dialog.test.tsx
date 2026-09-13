import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminTestsImportDialog } from './admin-tests-import-dialog';
import { findProfOrientationV3PlusCopies } from './admin-tests-import.helpers';

import type { TestTopicListItem } from '@/features/tests';

const createTopic = (overrides: Partial<TestTopicListItem> = {}): TestTopicListItem => ({
  id: 1,
  slug: 'prof-orientation-v3-plus',
  description: null,
  draftVersionNumber: 1,
  draftTitle: 'Профориентационный тест v3+',
  draftQuestionCount: 21,
  publishedVersionNumber: null,
  publishedTitle: null,
  activePublicLinkCount: 0,
  publicLinkCount: 0,
  attemptCount: 0,
  hasPublishedVersion: false,
  canDelete: true,
  scoringKind: 'PROF_ORIENTATION_V3_PLUS',
  hasUnpublishedChanges: false,
  updatedAt: '2026-09-11T10:00:00.000Z',
  ...overrides,
});

/**
 * Находка аудита FLOW-03: «Импорт v3+» одним кликом создавал шестую одинаковую копию методики и не
 * говорил, что пять уже есть. Теперь импорт сначала показывает существующие копии.
 */
describe('AdminTestsImportDialog', () => {
  afterEach(() => {
    cleanup();
  });

  it('finds methodology copies in both lists by scoring kind, not by title', () => {
    const renamedCopy = createTopic({ id: 2, draftTitle: 'Профориентация 9 класс' });
    const otherTest = createTopic({
      id: 3,
      scoringKind: 'DEFAULT',
      draftTitle: 'Профориентационный тест v3+',
    });
    const archivedCopy = createTopic({ id: 4, slug: 'prof-orientation-v3-plus-2' });

    expect(
      findProfOrientationV3PlusCopies([renamedCopy, otherTest], [archivedCopy]).map((copy) => [
        copy.topic.id,
        copy.isArchived,
      ]),
    ).toEqual([
      [2, false],
      [4, true],
    ]);
  });

  it('lists existing copies and lets the admin open one instead of creating another', async () => {
    const onOpenCopy = vi.fn();
    const onConfirm = vi.fn();

    render(
      <AdminTestsImportDialog
        open
        copies={[
          { topic: createTopic({ id: 7, publishedVersionNumber: 2 }), isArchived: false },
          {
            topic: createTopic({ id: 8, slug: 'prof-orientation-v3-plus-2' }),
            isArchived: true,
          },
        ]}
        isImporting={false}
        onOpenCopy={onOpenCopy}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/Уже есть 2 копии этой методики/)).toBeInTheDocument();
    expect(screen.getByText('Опубликован v2')).toBeInTheDocument();
    expect(screen.getByText('В архиве')).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'Открыть' })[1]);
    expect(onOpenCopy).toHaveBeenCalledWith(8);
    expect(onConfirm).not.toHaveBeenCalled();

    expect(screen.getByRole('button', { name: 'Создать еще одну' })).toBeInTheDocument();
  });

  it('asks a plain confirmation when there are no copies yet', async () => {
    const onConfirm = vi.fn();

    render(
      <AdminTestsImportDialog
        open
        copies={[]}
        isImporting={false}
        onOpenCopy={vi.fn()}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Открыть' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Импортировать' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
