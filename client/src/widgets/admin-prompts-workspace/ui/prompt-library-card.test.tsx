import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PromptLibraryCard } from './prompt-library-card';

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
): AnalysisPromptListResponseDtoPromptsItem => ({
  id: 7,
  title: 'Профориентация v3+',
  description: null,
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
  versions,
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
