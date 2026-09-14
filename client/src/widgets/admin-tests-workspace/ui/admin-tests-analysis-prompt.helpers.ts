import type { AnalysisPromptVersionSummary } from './admin-tests-analysis-prompt-settings-section';
import type { AnalysisPromptListResponseDtoPromptsItem } from '@/shared/api/model';

export interface NewerAnalysisPromptVersion {
  versionId: number;
  versionNumber: number;
  model: string;
}

interface GetNewerAnalysisPromptVersionParams {
  attachedVersion: AnalysisPromptVersionSummary | null;
  prompts: AnalysisPromptListResponseDtoPromptsItem[];
}

/**
 * Версия теста привязана к конкретной версии промпта и не следует за правками. Без этой проверки
 * админ не видел, что подключённая версия уже архивная, и правка промпта до учеников не доходила.
 */
export const getNewerAnalysisPromptVersion = ({
  attachedVersion,
  prompts,
}: GetNewerAnalysisPromptVersionParams): NewerAnalysisPromptVersion | null => {
  if (!attachedVersion) {
    return null;
  }

  const prompt = prompts.find((candidate) => candidate.id === attachedVersion.promptId);

  if (!prompt) {
    return null;
  }

  const publishedVersion = prompt.versions.find((version) => version.status === 'PUBLISHED');

  if (!publishedVersion || publishedVersion.id === attachedVersion.id) {
    return null;
  }

  return {
    versionId: publishedVersion.id,
    versionNumber: publishedVersion.versionNumber,
    model: publishedVersion.model,
  };
};
