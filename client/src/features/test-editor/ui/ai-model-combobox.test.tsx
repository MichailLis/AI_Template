import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AiModelCombobox } from './ai-model-combobox';

const renderCombobox = (state: {
  isLoading?: boolean;
  isError?: boolean;
  allModelsCount?: number;
  modelOptionsCount?: number;
}) =>
  render(
    <AiModelCombobox
      allModelsCount={state.allModelsCount ?? 0}
      modelOptionsCount={state.modelOptionsCount ?? 0}
      visibleModelOptions={[]}
      selectedModelItem={null}
      selectedModelId=""
      modelFilter="free"
      isLoading={state.isLoading ?? false}
      isError={state.isError ?? false}
      onSelectModel={vi.fn()}
      onModelFilterChange={vi.fn()}
      onRetryModels={vi.fn()}
    />,
  );

/**
 * Находка аудита UX-13: пока каталог моделей грузился (около 8 секунд), под полем стояло
 * «Показано 0 из 0 моделей, всего в каталоге 0» — как будто моделей нет вовсе.
 */
describe('AiModelCombobox catalog state', () => {
  afterEach(cleanup);

  it('shows a loading indicator instead of zero counters while the catalog loads', () => {
    renderCombobox({ isLoading: true });

    expect(screen.getByRole('status')).toHaveTextContent('Загружаем каталог моделей');
    expect(screen.queryByText(/Показано 0 из 0/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Всего в каталоге/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Нет моделей/)).not.toBeInTheDocument();
  });

  it('says the catalog failed to load and offers a retry instead of zero counters', () => {
    renderCombobox({ isError: true });

    expect(screen.getByText('Не удалось загрузить каталог моделей')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Повторить загрузку моделей' })).toBeInTheDocument();
    expect(screen.queryByText(/Показано 0 из 0/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Нет моделей/)).not.toBeInTheDocument();
  });

  it('shows the counters once the catalog has loaded', () => {
    renderCombobox({ allModelsCount: 349, modelOptionsCount: 5 });

    expect(screen.getByText(/из 5 моделей/)).toBeInTheDocument();
    expect(screen.getByText('Всего в каталоге: 349')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
