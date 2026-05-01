import { useState, type Dispatch, type SetStateAction } from 'react';

import { INITIAL_PROMPT, INITIAL_VARIABLES } from '../lib/constants';

import type { ModelFilter, PromptVariable, ResponseFormat } from '../model/types';

export const DEFAULT_PROMPT_TITLE = 'Карьерный анализ по тесту';
export const DEFAULT_PROMPT_DESCRIPTION = 'Промпт анализа студенческих ответов';

export interface AdminPromptsEditorState {
  selectedPromptId: number | null;
  setSelectedPromptId: Dispatch<SetStateAction<number | null>>;
  promptTitle: string;
  setPromptTitle: Dispatch<SetStateAction<string>>;
  model: string;
  setModel: Dispatch<SetStateAction<string>>;
  temperature: string;
  setTemperature: Dispatch<SetStateAction<string>>;
  responseFormat: ResponseFormat;
  setResponseFormat: Dispatch<SetStateAction<ResponseFormat>>;
  modelSearch: string;
  setModelSearch: Dispatch<SetStateAction<string>>;
  modelFilter: ModelFilter;
  setModelFilter: Dispatch<SetStateAction<ModelFilter>>;
  systemRole: string;
  setSystemRole: Dispatch<SetStateAction<string>>;
  maxTokens: string;
  setMaxTokens: Dispatch<SetStateAction<string>>;
  promptTemplate: string;
  setPromptTemplate: Dispatch<SetStateAction<string>>;
  promptEditorScrollTop: number;
  setPromptEditorScrollTop: Dispatch<SetStateAction<number>>;
  variables: PromptVariable[];
  setVariables: Dispatch<SetStateAction<PromptVariable[]>>;
  showMetrics: boolean;
  setShowMetrics: Dispatch<SetStateAction<boolean>>;
  diffView: boolean;
  setDiffView: Dispatch<SetStateAction<boolean>>;
  selectedTestId: number | null;
  setSelectedTestId: Dispatch<SetStateAction<number | null>>;
}

export function useAdminPromptsEditorState(): AdminPromptsEditorState {
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
  const [promptTitle, setPromptTitle] = useState(DEFAULT_PROMPT_TITLE);
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState('0.7');
  const [responseFormat, setResponseFormat] = useState<ResponseFormat>('json');
  const [modelSearch, setModelSearch] = useState('');
  const [modelFilter, setModelFilter] = useState<ModelFilter>('free');
  const [systemRole, setSystemRole] = useState('Career Counselor Expert');
  const [maxTokens, setMaxTokens] = useState('2048');
  const [promptTemplate, setPromptTemplate] = useState(INITIAL_PROMPT);
  const [promptEditorScrollTop, setPromptEditorScrollTop] = useState(0);
  const [variables, setVariables] = useState<PromptVariable[]>(INITIAL_VARIABLES);
  const [showMetrics, setShowMetrics] = useState(true);
  const [diffView, setDiffView] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);

  return {
    selectedPromptId,
    setSelectedPromptId,
    promptTitle,
    setPromptTitle,
    model,
    setModel,
    temperature,
    setTemperature,
    responseFormat,
    setResponseFormat,
    modelSearch,
    setModelSearch,
    modelFilter,
    setModelFilter,
    systemRole,
    setSystemRole,
    maxTokens,
    setMaxTokens,
    promptTemplate,
    setPromptTemplate,
    promptEditorScrollTop,
    setPromptEditorScrollTop,
    variables,
    setVariables,
    showMetrics,
    setShowMetrics,
    diffView,
    setDiffView,
    selectedTestId,
    setSelectedTestId,
  };
}
