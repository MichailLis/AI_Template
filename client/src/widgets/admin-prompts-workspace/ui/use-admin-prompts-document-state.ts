import { useState, type Dispatch, type SetStateAction } from 'react';

import { DEFAULT_PROMPT_TITLE, INITIAL_PROMPT, INITIAL_VARIABLES } from '../lib/constants';

import type { PromptVariable } from '../model/types';

export interface AdminPromptsDocumentState {
  selectedPromptId: number | null;
  setSelectedPromptId: Dispatch<SetStateAction<number | null>>;
  promptTitle: string;
  setPromptTitle: Dispatch<SetStateAction<string>>;
  promptTemplate: string;
  setPromptTemplate: Dispatch<SetStateAction<string>>;
  promptEditorScrollTop: number;
  setPromptEditorScrollTop: Dispatch<SetStateAction<number>>;
  variables: PromptVariable[];
  setVariables: Dispatch<SetStateAction<PromptVariable[]>>;
}

/** The prompt being edited: which one, its title, body, variables and editor position. */
export function useAdminPromptsDocumentState(): AdminPromptsDocumentState {
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
  const [promptTitle, setPromptTitle] = useState(DEFAULT_PROMPT_TITLE);
  const [promptTemplate, setPromptTemplate] = useState(INITIAL_PROMPT);
  const [promptEditorScrollTop, setPromptEditorScrollTop] = useState(0);
  const [variables, setVariables] = useState<PromptVariable[]>(INITIAL_VARIABLES);

  return {
    selectedPromptId,
    setSelectedPromptId,
    promptTitle,
    setPromptTitle,
    promptTemplate,
    setPromptTemplate,
    promptEditorScrollTop,
    setPromptEditorScrollTop,
    variables,
    setVariables,
  };
}
