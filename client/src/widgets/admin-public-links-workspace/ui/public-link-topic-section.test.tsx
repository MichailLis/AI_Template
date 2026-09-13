import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PublicLinkTopicSection } from './public-link-topic-section';

describe('PublicLinkTopicSection', () => {
  afterEach(() => {
    cleanup();
  });

  it('disables the topic select when no published tests are available', () => {
    render(
      <PublicLinkTopicSection topics={[]} effectiveSelectedTopicId={0} onSelectTopic={vi.fn()} />,
    );

    const topicSelect = screen.getByLabelText('Тест для публикации');

    expect(topicSelect).toBeDisabled();
    expect(topicSelect).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Нет доступных тестов' })).toBeInTheDocument();
  });

  /**
   * Находка аудита UX-14: неопубликованные тесты стояли вперемешку с опубликованными, а бейдж
   * «10 доступно» считал и те, по которым ссылку создать нельзя.
   */
  it('lists published tests first and groups the rest as needing publication', () => {
    render(
      <PublicLinkTopicSection
        topics={[
          { id: 5, draftTitle: 'Черновик без публикации', publishedVersionNumber: null },
          { id: 7, draftTitle: 'Профориентация', publishedVersionNumber: 2 },
          { id: 9, draftTitle: 'Soft skills', publishedVersionNumber: 1 },
        ]}
        effectiveSelectedTopicId={7}
        onSelectTopic={vi.fn()}
      />,
    );

    const groups = screen.getAllByRole('group');
    expect(groups.map((group) => group.getAttribute('label'))).toEqual([
      'Опубликованные',
      'Нужно опубликовать',
    ]);
    expect([...groups[0].querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'Профориентация',
      'Soft skills',
    ]);
    expect([...groups[1].querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'Черновик без публикации',
    ]);
    expect(screen.getByText('2 опубликовано')).toBeInTheDocument();
    expect(screen.queryByText(/доступно/)).not.toBeInTheDocument();
  });

  it('reports selected topic ids as numbers', async () => {
    const user = userEvent.setup();
    const onSelectTopic = vi.fn();

    render(
      <PublicLinkTopicSection
        topics={[
          { id: 11, draftTitle: 'Career skills', publishedVersionNumber: 1 },
          { id: 12, draftTitle: 'Soft skills', publishedVersionNumber: 1 },
        ]}
        effectiveSelectedTopicId={11}
        onSelectTopic={onSelectTopic}
      />,
    );

    const topicSelect = screen.getByLabelText('Тест для публикации');
    expect(topicSelect).toHaveValue('11');

    await user.selectOptions(topicSelect, '12');

    expect(onSelectTopic).toHaveBeenCalledWith(12);
  });
});
