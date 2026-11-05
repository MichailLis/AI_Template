import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { formatDateTime } from '@/shared/lib/date-format';

import { AiUsageSummary } from './admin-settings-ai-usage';
import { getAiUsagePeriodStart } from './admin-settings-ai-usage.model';

import type { AiUsageSummaryData } from './admin-settings-ai-usage.model';

const hoisted = vi.hoisted(() => ({
  refetch: vi.fn(),
  hook: vi.fn(),
  state: {
    data: undefined as unknown,
    isLoading: false,
    isError: false,
    isFetching: false,
  },
}));

vi.mock('@/shared/api/generated/admin/admin', () => ({
  useAdminAiUsageControllerGetSummary: (params: { from: string }) => {
    hoisted.hook(params);
    return { ...hoisted.state, refetch: hoisted.refetch };
  },
}));

const emptyBucket = {
  calls: 0,
  failedCalls: 0,
  callsWithoutCost: 0,
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  cost: '0.00000000',
};

const summary = (overrides: Partial<AiUsageSummaryData> = {}): AiUsageSummaryData => ({
  from: '2026-11-04T21:00:00.000Z',
  to: '2026-11-05T10:00:00.000Z',
  totals: {
    calls: 5,
    failedCalls: 1,
    callsWithoutCost: 0,
    promptTokens: 31_000,
    completionTokens: 5_500,
    totalTokens: 36_500,
    cost: '0.34500000',
  },
  byPurpose: [
    {
      ...emptyBucket,
      purpose: 'STUDENT_ANALYSIS',
      calls: 4,
      failedCalls: 1,
      totalTokens: 36_000,
      cost: '0.3',
    },
    { ...emptyBucket, purpose: 'CONNECTION_CHECK', calls: 1, totalTokens: 500, cost: '0.045' },
  ],
  byModel: [
    {
      ...emptyBucket,
      model: 'deepseek/deepseek-v4-flash',
      calls: 5,
      totalTokens: 36_500,
      cost: '0.345',
    },
  ],
  ...overrides,
});

describe('AiUsageSummary', () => {
  beforeEach(() => {
    hoisted.state.data = summary();
    hoisted.state.isLoading = false;
    hoisted.state.isError = false;
    hoisted.state.isFetching = false;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows calls, tokens and cost of the period and the breakdown by purpose and model', () => {
    render(<AiUsageSummary />);

    expect(screen.getByText('неудачных: 1')).toBeInTheDocument();
    expect(screen.getByText(/запрос 31\s000 · ответ 5\s500/)).toBeInTheDocument();
    expect(screen.getAllByText('0,345')).toHaveLength(2); // totals and the model row

    const byPurpose = screen.getByRole('table', { name: 'Расходы по виду вызова' });
    expect(within(byPurpose).getByText('Анализ попытки')).toBeInTheDocument();
    expect(within(byPurpose).getByText('Проверка связи')).toBeInTheDocument();
    expect(within(byPurpose).getByText(/4 \(неудачных: 1\)/)).toBeInTheDocument();

    const byModel = screen.getByRole('table', { name: 'Расходы по модели' });
    expect(within(byModel).getByText('deepseek/deepseek-v4-flash')).toBeInTheDocument();
  });

  it('prints the period in the viewer local time', () => {
    render(<AiUsageSummary />);

    expect(
      screen.getByText(
        new RegExp(
          `С ${formatDateTime('2026-11-04T21:00:00.000Z')} по ${formatDateTime('2026-11-05T10:00:00.000Z')}`,
        ),
      ),
    ).toBeInTheDocument();
  });

  it('asks for today from the local midnight, then for 7 and 30 days on the tabs', () => {
    render(<AiUsageSummary />);

    const sentFrom = () => new Date(hoisted.hook.mock.lastCall?.[0].from as string);
    const now = new Date();
    expect(sentFrom()).toEqual(new Date(now.getFullYear(), now.getMonth(), now.getDate()));

    fireEvent.click(screen.getByRole('tab', { name: '7 дней' }));
    expect(sentFrom()).toEqual(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));

    fireEvent.click(screen.getByRole('tab', { name: '30 дней' }));
    expect(sentFrom()).toEqual(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29));
  });

  it('warns that the sum is understated when the provider sent no cost for some calls', () => {
    hoisted.state.data = summary({
      totals: { ...summary().totals, callsWithoutCost: 2 },
    });
    render(<AiUsageSummary />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'У 2 успешных вызовов провайдер не прислал стоимость: сумма занижена.',
    );
  });

  it('says so when nothing was called in the period, without empty tables', () => {
    hoisted.state.data = summary({ totals: emptyBucket, byPurpose: [], byModel: [] });
    render(<AiUsageSummary />);

    expect(screen.getByText('За этот период вызовов ИИ не было.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows loading, and an error with a retry', () => {
    hoisted.state.data = undefined;
    hoisted.state.isLoading = true;
    const { rerender } = render(<AiUsageSummary />);
    expect(screen.getByText('Считаем расходы...')).toBeInTheDocument();

    hoisted.state.isLoading = false;
    hoisted.state.isError = true;
    rerender(<AiUsageSummary />);
    expect(screen.getByText('Не удалось загрузить расходы на ИИ.')).toBeInTheDocument();
  });

  it('refreshes on demand and locks the button while fetching', () => {
    const { rerender } = render(<AiUsageSummary />);

    fireEvent.click(screen.getByRole('button', { name: 'Обновить расходы' }));
    expect(hoisted.refetch).toHaveBeenCalledTimes(1);

    hoisted.state.isFetching = true;
    rerender(<AiUsageSummary />);
    expect(screen.getByRole('button', { name: 'Обновить расходы' })).toBeDisabled();
  });
});

describe('getAiUsagePeriodStart', () => {
  it('starts at the local midnight, counting today as the first day', () => {
    const now = new Date(2026, 10, 5, 15, 30, 12);

    expect(getAiUsagePeriodStart(1, now)).toEqual(new Date(2026, 10, 5, 0, 0, 0));
    expect(getAiUsagePeriodStart(7, now)).toEqual(new Date(2026, 10, 5 - 6, 0, 0, 0));
    expect(getAiUsagePeriodStart(30, now)).toEqual(new Date(2026, 9, 7, 0, 0, 0));
  });

  it('keeps midnight across the end of daylight saving time, where 24 hours would not', () => {
    // Europe moved the clocks back on 2026-10-25: that day has 25 hours.
    const now = new Date(2026, 9, 26, 10, 0, 0);

    const start = getAiUsagePeriodStart(2, now);

    expect(start.getHours()).toBe(0);
    expect(start.getDate()).toBe(25);
  });
});
