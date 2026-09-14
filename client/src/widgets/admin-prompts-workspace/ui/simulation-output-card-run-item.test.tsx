import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SimulationRunItem } from './simulation-output-card-run-item';

import type { SimulationRun } from '../model/types';

const successfulRun: SimulationRun = {
  id: 'run-2',
  createdAt: '14:23:05',
  status: 'success',
  model: 'deepseek/deepseek-chat-v3-0324:free',
  prompt: 'Проанализируй ответы',
  output: '{"introduction":"..."}',
  latencyMs: 840,
  totalTokens: 452,
};

/**
 * Находка аудита UX-07: в истории проверки стояли «Completed» и «Copy JSON», а модель запуска без
 * подписи читалась как третья «текущая» модель рядом с моделью редактора и сохраненного промпта.
 */
describe('SimulationRunItem', () => {
  afterEach(() => {
    cleanup();
  });

  it('labels the run in Russian and names the model it was run with', () => {
    render(
      <SimulationRunItem
        run={successfulRun}
        showMetrics
        diffView={false}
        onCopyRunJson={vi.fn()}
        totalRuns={2}
        runIndex={0}
      />,
    );

    expect(screen.getByText('Готово')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Копировать JSON' })).toBeInTheDocument();
    expect(
      screen.getByText('Модель запуска: deepseek/deepseek-chat-v3-0324:free'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Completed|Copy JSON|Latency|Tokens/)).not.toBeInTheDocument();
  });
});
