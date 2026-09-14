import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SimulationOutputCardHeader } from './simulation-output-card-header';

/**
 * Находка аудита UX-06: переключатель назывался «JSON-view», хотя он просто показывает ответ модели
 * без форматирования — как модель его вернула.
 */
describe('SimulationOutputCardHeader', () => {
  afterEach(cleanup);

  it('names the raw output switch in Russian', async () => {
    const onDiffViewChange = vi.fn();

    render(
      <SimulationOutputCardHeader
        showMetrics={false}
        onShowMetricsChange={vi.fn()}
        diffView={false}
        onDiffViewChange={onDiffViewChange}
        onClearLogs={vi.fn()}
      />,
    );

    expect(screen.queryByText('JSON-view')).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Ответ как есть'));
    expect(onDiffViewChange).toHaveBeenCalledWith(true);
  });
});
