import type { ModelFilter, PromptVariable } from '../model/types';
import type { useAnalysisPromptsControllerCreatePrompt } from '@/shared/api/generated/admin/admin';
import type { useAnalysisPromptsControllerDeletePrompt } from '@/shared/api/generated/admin/admin';
import type { useAnalysisPromptsControllerListPrompts } from '@/shared/api/generated/admin/admin';
import type { useAnalysisPromptsControllerPublishVersion } from '@/shared/api/generated/admin/admin';
import type { useAnalysisPromptsControllerUpdatePrompt } from '@/shared/api/generated/admin/admin';
import type {
  AdminPromptModelsResponseDtoModelsItem,
  AnalysisPromptListResponseDtoPromptsItem,
} from '@/shared/api/model';
import type { Dispatch, SetStateAction } from 'react';

export interface UseAdminPromptsActionsParams {
  prompts: AnalysisPromptListResponseDtoPromptsItem[];
  structuredOutputModels: AdminPromptModelsResponseDtoModelsItem[];
  defaultModel?: string;
  selectedPromptId: number | null;
  selectedPrompt: AnalysisPromptListResponseDtoPromptsItem | null;
  promptTitle: string;
  selectedModel: string;
  selectedModelItem: { supportsStructuredOutputs?: boolean } | null;
  temperature: string;
  promptTemplate: string;
  variables: PromptVariable[];
  promptsQuery: Pick<ReturnType<typeof useAnalysisPromptsControllerListPrompts>, 'refetch'>;
  createPromptMutation: ReturnType<typeof useAnalysisPromptsControllerCreatePrompt>;
  updatePromptMutation: ReturnType<typeof useAnalysisPromptsControllerUpdatePrompt>;
  deletePromptMutation: ReturnType<typeof useAnalysisPromptsControllerDeletePrompt>;
  publishVersionMutation: ReturnType<typeof useAnalysisPromptsControllerPublishVersion>;
  setSelectedPromptId: Dispatch<SetStateAction<number | null>>;
  setPromptTitle: Dispatch<SetStateAction<string>>;
  setModel: Dispatch<SetStateAction<string>>;
  setTemperature: Dispatch<SetStateAction<string>>;
  setPromptTemplate: Dispatch<SetStateAction<string>>;
  setPromptEditorScrollTop: Dispatch<SetStateAction<number>>;
  setModelSearch: Dispatch<SetStateAction<string>>;
  setModelFilter: Dispatch<SetStateAction<ModelFilter>>;
  setVariables: Dispatch<SetStateAction<PromptVariable[]>>;
}
