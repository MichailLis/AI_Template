import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminTabs } from './admin-tabs';

const tabs = [
  { value: 'first', label: 'Первая' },
  { value: 'second', label: 'Вторая' },
];

describe('AdminTabs', () => {
  afterEach(cleanup);

  it('exposes the tablist contract with only the active tab in the tab order', () => {
    render(
      <AdminTabs
        ariaLabel="Разделы"
        tabs={tabs}
        activeTab="first"
        onTabChange={vi.fn()}
        panelId="panel"
      />,
    );

    expect(screen.getByRole('tablist', { name: 'Разделы' })).toBeInTheDocument();

    const activeTab = screen.getByRole('tab', { name: 'Первая' });
    const inactiveTab = screen.getByRole('tab', { name: 'Вторая' });

    expect(activeTab).toHaveAttribute('aria-selected', 'true');
    expect(activeTab).toHaveAttribute('aria-controls', 'panel');
    expect(activeTab).toHaveAttribute('tabindex', '0');
    expect(inactiveTab).toHaveAttribute('tabindex', '-1');
  });

  it('moves between tabs with the arrow keys', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();

    render(
      <AdminTabs ariaLabel="Разделы" tabs={tabs} activeTab="first" onTabChange={onTabChange} />,
    );

    await user.click(screen.getByRole('tab', { name: 'Первая' }));
    await user.keyboard('{ArrowRight}');

    expect(onTabChange).toHaveBeenLastCalledWith('second');
  });

  it('wraps backwards from the first tab to the last one', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();

    render(
      <AdminTabs ariaLabel="Разделы" tabs={tabs} activeTab="second" onTabChange={onTabChange} />,
    );

    await user.click(screen.getByRole('tab', { name: 'Вторая' }));
    await user.keyboard('{ArrowLeft}');

    expect(onTabChange).toHaveBeenLastCalledWith('first');
  });
});
