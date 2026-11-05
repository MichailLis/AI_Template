import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminAiProviderCheckResponseDtoReason } from '@/shared/api/model';
import { formatDateTime } from '@/shared/lib/date-format';

import { AiProviderCheck } from './admin-settings-ai-provider-check';
import { aiCheckReasonLabels } from './admin-settings-cards.model';

import type { AiProviderCheck as AiProviderCheckResult } from './admin-settings-cards.model';

const hoisted = vi.hoisted(() => ({
  mutate: vi.fn(),
  state: { data: undefined as unknown, isPending: false },
  options: { current: undefined as unknown },
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock('@/shared/api/generated/admin/admin', () => ({
  useAdminSettingsControllerCheckAiProvider: (options: unknown) => {
    hoisted.options.current = options;
    return { mutate: hoisted.mutate, data: hoisted.state.data, isPending: hoisted.state.isPending };
  },
}));

const CHECKED_AT = '2026-09-12T20:05:00.000Z';

const failed = (overrides: Partial<AiProviderCheckResult>): AiProviderCheckResult => ({
  status: 'failed',
  checkedAt: CHECKED_AT,
  model: 'openai/gpt-4o-mini',
  ...overrides,
});

describe('AiProviderCheck', () => {
  beforeEach(() => {
    hoisted.state.data = undefined;
    hoisted.state.isPending = false;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('explains what the badge does not check and what the button does', () => {
    render(<AiProviderCheck />);

    expect(
      screen.getByText(/показывает только, что провайдер отдаёт каталог моделей/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Запрос платный, поэтому выполняется только по нажатию/),
    ).toBeInTheDocument();
  });

  it('sends nothing until the button is pressed, then sends one request', () => {
    render(<AiProviderCheck />);

    expect(hoisted.mutate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Проверить ключ и баланс' }));

    expect(hoisted.mutate).toHaveBeenCalledTimes(1);
  });

  it('locks the button while the paid request is running', () => {
    hoisted.state.isPending = true;
    render(<AiProviderCheck />);

    expect(screen.getByRole('button', { name: 'Проверяем...' })).toBeDisabled();
  });

  it('reports a request that went through', () => {
    hoisted.state.data = { status: 'ok', checkedAt: CHECKED_AT, model: 'openai/gpt-4o-mini' };
    render(<AiProviderCheck />);

    expect(screen.getByRole('status')).toHaveTextContent(
      `Запрос к модели openai/gpt-4o-mini выполнен: ключ принят, средств хватило · ${formatDateTime(CHECKED_AT)}`,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('names a refused key with its HTTP status and the provider text', () => {
    hoisted.state.data = failed({
      reason: 'AUTH',
      httpStatus: 401,
      errorMessage: 'Неверные учётные данные авторизации',
    });
    render(<AiProviderCheck />);

    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent('Запрос к модели openai/gpt-4o-mini не прошёл (HTTP 401)');
    expect(alert).toHaveTextContent('Провайдер не принял ключ: он отозван, неверен');
    expect(alert).toHaveTextContent('Ответ провайдера: Неверные учётные данные авторизации');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('names an empty balance as such', () => {
    hoisted.state.data = failed({ reason: 'PAYMENT', httpStatus: 402 });
    render(<AiProviderCheck />);

    expect(screen.getByRole('alert')).toHaveTextContent('На балансе провайдера не хватает средств');
  });

  it('does not invent an HTTP status for a connection that never answered', () => {
    hoisted.state.data = failed({ reason: 'NETWORK' });
    render(<AiProviderCheck />);

    expect(screen.getByRole('alert')).not.toHaveTextContent('HTTP');
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось соединиться с провайдером');
  });

  it('has a Russian explanation for every reason the server can send', () => {
    for (const reason of Object.values(AdminAiProviderCheckResponseDtoReason)) {
      expect(aiCheckReasonLabels[reason]).toMatch(/[а-яё]/i);
    }
  });

  it('toasts a request that could not be made at all', () => {
    render(<AiProviderCheck />);

    (
      hoisted.options.current as { mutation: { onError: (error: unknown) => void } }
    ).mutation.onError(new Error('network'));

    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});
