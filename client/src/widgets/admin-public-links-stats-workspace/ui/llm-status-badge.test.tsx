import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { adminBadgeClassNames } from '@/shared/ui/admin-design-tokens';

import { LlmStatusBadge } from './llm-status-badge';

describe('LlmStatusBadge', () => {
  afterEach(cleanup);

  it.each([
    { status: 'ready', label: 'ИИ готов', className: adminBadgeClassNames.success },
    { status: 'pending', label: 'ИИ в обработке', className: adminBadgeClassNames.warning },
    { status: 'failed', label: 'ИИ ошибка', className: adminBadgeClassNames.danger },
    {
      status: 'not_requested',
      label: 'ИИ не запрашивался',
      className: adminBadgeClassNames.neutral,
    },
  ])('renders the $status label with its established tone', ({ status, label, className }) => {
    render(<LlmStatusBadge status={status} />);

    expect(screen.getByText(label)).toHaveClass(className);
  });

  it.each([null, undefined, 'unknown'])('does not render a badge for status %s', (status) => {
    const { container } = render(<LlmStatusBadge status={status} />);

    expect(container).toBeEmptyDOMElement();
  });
});
