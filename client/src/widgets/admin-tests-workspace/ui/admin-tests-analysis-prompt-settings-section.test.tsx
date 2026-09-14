import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminTestsAnalysisPromptSettingsSection } from './admin-tests-analysis-prompt-settings-section';

vi.mock('@/shared/api/generated/admin/admin', () => ({
  useAnalysisPromptsControllerListPrompts: () => ({
    data: { prompts: [] },
    isLoading: false,
    isError: false,
  }),
}));

const attachedVersion = {
  id: 42,
  promptId: 7,
  promptTitle: 'Профориентация v3+',
  versionNumber: 2,
  model: 'deepseek/deepseek-v4-flash',
  promptArchived: false,
};

/**
 * ait-rcw.30: промпт, подключенный к черновику, можно удалить, а редактор теста продолжал показывать
 * его как обычный — и публикация без замены проходила молча.
 */
describe('AdminTestsAnalysisPromptSettingsSection', () => {
  afterEach(cleanup);

  it('warns that the attached prompt has been deleted and blocks publishing', () => {
    render(
      <AdminTestsAnalysisPromptSettingsSection
        selectedAnalysisPromptVersion={{ ...attachedVersion, promptArchived: true }}
        selectedAnalysisPromptVersionId={42}
        isSelectedTopicArchived={false}
        onDraftAnalysisPromptVersionChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText('Промпт удален. Подключите другой промпт — иначе тест не опубликовать.'),
    ).toBeInTheDocument();
  });

  it('shows no deletion warning for a live prompt', () => {
    render(
      <AdminTestsAnalysisPromptSettingsSection
        selectedAnalysisPromptVersion={attachedVersion}
        selectedAnalysisPromptVersionId={42}
        isSelectedTopicArchived={false}
        onDraftAnalysisPromptVersionChange={vi.fn()}
      />,
    );

    expect(screen.queryByText(/Промпт удален/)).not.toBeInTheDocument();
  });
});
