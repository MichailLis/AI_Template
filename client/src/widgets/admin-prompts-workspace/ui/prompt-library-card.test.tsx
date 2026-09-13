import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PromptLibraryCard } from './prompt-library-card';

vi.mock('@/shared/api/generated/admin/admin', () => ({
  useAnalysisPromptsControllerGetPromptHistory: () => ({
    data: {
      events: [
        {
          id: 1,
          action: 'PROMPT_VERSION_CREATED',
          actor: { id: 1, email: 'admin@admin.admin', name: null },
          changes: [
            {
              field: 'model',
              before: 'google/gemini-2.0-flash-exp:free',
              after: 'deepseek/deepseek-v4-flash',
            },
          ],
          createdAt: '2026-09-13T10:00:00.000Z',
        },
      ],
    },
    isLoading: false,
    isError: false,
  }),
}));

import type {
  AnalysisPromptListResponseDtoPromptsItem,
  AnalysisPromptListResponseDtoPromptsItemVersionsItem,
} from '@/shared/api/model';

const makePromptVersion = (
  overrides: Partial<AnalysisPromptListResponseDtoPromptsItemVersionsItem>,
): AnalysisPromptListResponseDtoPromptsItemVersionsItem => ({
  id: 1,
  promptId: 7,
  versionNumber: 1,
  status: 'PUBLISHED',
  model: 'openai/gpt-oss-120b',
  temperature: 0.2,
  prompt: 'Analyze',
  usedInTestCount: 0,
  publishedAt: '2026-09-01T10:00:00.000Z',
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
  ...overrides,
});

const makePrompt = (
  versions: AnalysisPromptListResponseDtoPromptsItemVersionsItem[],
  activeTests: AnalysisPromptListResponseDtoPromptsItem['activeTests'] = [],
): AnalysisPromptListResponseDtoPromptsItem => ({
  id: 7,
  title: 'Профориентация v3+',
  description: null,
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
  versions,
  activeTests,
});

const baseProps = {
  selectedPromptId: null,
  isLoading: false,
  isDeleting: false,
  onCreateNewPrompt: vi.fn(),
  onSelectPrompt: vi.fn(),
  onDeletePrompt: vi.fn(),
};

describe('PromptLibraryCard', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('warns that tests are left on older versions of the prompt', () => {
    const prompt = makePrompt([
      makePromptVersion({ id: 43, versionNumber: 2, status: 'PUBLISHED', usedInTestCount: 1 }),
      makePromptVersion({ id: 42, versionNumber: 1, status: 'ARCHIVED', usedInTestCount: 3 }),
    ]);

    render(<PromptLibraryCard {...baseProps} prompts={[prompt]} />);

    expect(screen.getByText('Действует v2, используется в 1 тесте')).toBeInTheDocument();
    expect(screen.getByText('3 теста остались на прежних версиях промпта')).toBeInTheDocument();
  });

  it('says nothing about older versions when every test uses the published one', () => {
    const prompt = makePrompt([
      makePromptVersion({ id: 43, versionNumber: 2, status: 'PUBLISHED', usedInTestCount: 5 }),
      makePromptVersion({ id: 42, versionNumber: 1, status: 'ARCHIVED', usedInTestCount: 0 }),
    ]);

    render(<PromptLibraryCard {...baseProps} prompts={[prompt]} />);

    expect(screen.getByText('Действует v2, используется в 5 тестах')).toBeInTheDocument();
    expect(screen.queryByText(/остал/)).not.toBeInTheDocument();
  });

  it('says an unpublished prompt is used by no test', () => {
    const prompt = makePrompt([
      makePromptVersion({ id: 42, versionNumber: 1, status: 'DRAFT', usedInTestCount: 0 }),
    ]);

    render(<PromptLibraryCard {...baseProps} prompts={[prompt]} />);

    expect(screen.getByText('Не опубликован, тесты его не используют')).toBeInTheDocument();
  });
});

/**
 * Находка аудита FLOW-05: удаление архивировало промпт, не глядя на тесты. Фоновый анализ берет
 * промпт из версии теста и на архив не смотрит, поэтому «удаленный» промпт молча продолжал бы
 * анализировать прохождения опубликованных тестов.
 */
describe('PromptLibraryCard deletion', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const publishedVersion = makePromptVersion({ id: 43, versionNumber: 2, usedInTestCount: 1 });

  it('refuses to delete a prompt that published tests rely on and names them', async () => {
    const user = userEvent.setup();
    render(
      <PromptLibraryCard
        {...baseProps}
        prompts={[
          makePrompt(
            [publishedVersion],
            [
              {
                topicId: 8,
                title: 'Профориентационный тест v3+',
                slug: 'prof-orientation-v3-plus-5',
                onPublishedVersion: true,
              },
              {
                topicId: 247,
                title: 'Демо: профориентационный тест',
                slug: 'demo-career-orientation',
                onPublishedVersion: false,
              },
            ],
          ),
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Удалить промпт Профориентация v3+' }));

    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByText('Промпт нельзя удалить')).toBeInTheDocument();
    expect(
      within(dialog).getByText(/«Профориентационный тест v3\+» \(prof-orientation-v3-plus-5\)/),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Удалить' })).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Закрыть' })).toBeInTheDocument();
  });

  it('warns about drafts that still point at the prompt and lets it be deleted', async () => {
    const user = userEvent.setup();
    render(
      <PromptLibraryCard
        {...baseProps}
        prompts={[
          makePrompt(
            [publishedVersion],
            [
              {
                topicId: 247,
                title: 'Демо: профориентационный тест',
                slug: 'demo-career-orientation',
                onPublishedVersion: false,
              },
            ],
          ),
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Удалить промпт Профориентация v3+' }));

    const dialog = screen.getByRole('alertdialog');
    expect(
      within(dialog).getByText(
        /черновикам: «Демо: профориентационный тест» \(demo-career-orientation\)/,
      ),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Удалить' }));

    expect(baseProps.onDeletePrompt).toHaveBeenCalledWith(7);
  });

  it('keeps the plain confirmation for a prompt no active test uses', async () => {
    const user = userEvent.setup();
    render(<PromptLibraryCard {...baseProps} prompts={[makePrompt([publishedVersion])]} />);

    await user.click(screen.getByRole('button', { name: 'Удалить промпт Профориентация v3+' }));

    expect(screen.getByText('Удалить промпт?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Удалить' })).toBeInTheDocument();
  });
});

/** Находка аудита FLOW-06: нельзя было узнать, кто и когда поменял промпт. */
describe('PromptLibraryCard history', () => {
  afterEach(() => {
    cleanup();
  });

  it('opens the history of a prompt with who changed what', async () => {
    const user = userEvent.setup();
    render(
      <PromptLibraryCard
        {...baseProps}
        prompts={[makePrompt([makePromptVersion({ id: 43, versionNumber: 2 })])]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'История промпта Профориентация v3+' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Создана новая версия промпта')).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'Модель: google/gemini-2.0-flash-exp:free → deepseek/deepseek-v4-flash',
      ),
    ).toBeInTheDocument();
    expect(baseProps.onSelectPrompt).not.toHaveBeenCalled();
  });
});
