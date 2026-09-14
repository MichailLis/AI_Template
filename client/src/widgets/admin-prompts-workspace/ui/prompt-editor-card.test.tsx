import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PromptEditorCard } from './prompt-editor-card';

import type { AdminPromptModelsResponseDtoModelsItem } from '@/shared/api/model';
import type { ComponentProps } from 'react';

const makeModel = (
  id: string,
  label: string,
  isFree: boolean,
): AdminPromptModelsResponseDtoModelsItem => ({
  id,
  label,
  provider: 'openrouter',
  isFree,
  supportsStructuredOutputs: true,
  contextLength: null,
  promptPrice: null,
  completionPrice: null,
});

const freeModel = makeModel('dots/dots3-note:free', 'Dots Studio: Dots3-Note Preview (free)', true);
const savedModel = makeModel('deepseek/deepseek-v4-flash', 'DeepSeek: V4 Flash', false);

const renderCard = (overrides: Partial<ComponentProps<typeof PromptEditorCard>> = {}) => {
  const props: ComponentProps<typeof PromptEditorCard> = {
    modelSearch: '',
    onModelSearchChange: vi.fn(),
    modelFilter: 'free',
    onModelFilterChange: vi.fn(),
    filteredModels: [freeModel],
    allModelsCount: 2,
    selectedModel: freeModel.id,
    onModelChange: vi.fn(),
    selectedModelItem: freeModel,
    temperature: '0.7',
    onTemperatureChange: vi.fn(),
    systemRole: 'Career Counselor Expert',
    onSystemRoleChange: vi.fn(),
    maxTokens: '2048',
    onMaxTokensChange: vi.fn(),
    responseFormat: 'json',
    onResponseFormatChange: vi.fn(),
    promptTemplate: 'Проанализируй ответы',
    onPromptTemplateChange: vi.fn(),
    promptLineCount: 1,
    promptEditorScrollTop: 0,
    onPromptEditorScrollTopChange: vi.fn(),
    variables: [],
    duplicateVariableData: { duplicateKeys: [], duplicateIds: new Set<string>() },
    onVariableChange: vi.fn(),
    onAddVariable: vi.fn(),
    onRemoveVariable: vi.fn(),
    editingPrompt: null,
    modelMismatch: null,
    ...overrides,
  };

  render(<PromptEditorCard {...props} />);

  return props;
};

/**
 * Находка аудита UX-07: страница открывалась в неявном состоянии «Новый промпт» с моделью Dots
 * Studio, хотя сохраненный промпт использует deepseek/deepseek-v4-flash. Было непонятно, правишь ли
 * ты сохраненный промпт или создаешь новый и какая модель сохранится.
 */
describe('PromptEditorCard editing mode', () => {
  afterEach(() => {
    cleanup();
  });

  it('says a new prompt is being written when no saved prompt is selected', () => {
    renderCard();

    expect(screen.getByText('Новый промпт')).toBeInTheDocument();
    expect(screen.queryByText(/Редактирование:/)).not.toBeInTheDocument();
    expect(screen.queryByText('Structured outputs')).not.toBeInTheDocument();
  });

  it('names the saved prompt and the version being edited', () => {
    renderCard({ editingPrompt: { title: 'Профориентация v3+', versionNumber: 2 } });

    expect(screen.getByText('Редактирование: Профориентация v3+ (v2)')).toBeInTheDocument();
    expect(screen.queryByText('Новый промпт')).not.toBeInTheDocument();
  });

  it('warns when the chosen model differs from the saved version and restores it', async () => {
    const user = userEvent.setup();
    const props = renderCard({
      editingPrompt: { title: 'Профориентация v3+', versionNumber: 2 },
      modelMismatch: { versionNumber: 2, savedModel: savedModel.id },
    });

    expect(
      screen.getByText(/Модель отличается от сохраненной в v2: deepseek\/deepseek-v4-flash/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Вернуть модель v2' }));

    expect(props.onModelChange).toHaveBeenCalledWith(savedModel.id);
  });

  it('keeps the selected model in the list when the filter hides it', () => {
    renderCard({
      filteredModels: [freeModel],
      selectedModel: savedModel.id,
      selectedModelItem: savedModel,
    });

    expect(screen.getByLabelText('Модель')).toHaveValue(savedModel.id);
    expect(screen.getByRole('option', { name: 'DeepSeek: V4 Flash' })).toBeInTheDocument();
  });
});
