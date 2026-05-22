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

  it('reports selected topic ids as numbers', async () => {
    const user = userEvent.setup();
    const onSelectTopic = vi.fn();

    render(
      <PublicLinkTopicSection
        topics={[
          { id: 11, draftTitle: 'Career skills' },
          { id: 12, draftTitle: 'Soft skills' },
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
