import { useState, type Dispatch, type SetStateAction } from 'react';

import {
  useAdminPromptsDocumentState,
  type AdminPromptsDocumentState,
} from './use-admin-prompts-document-state';
import {
  useAdminPromptsModelState,
  type AdminPromptsModelState,
} from './use-admin-prompts-model-state';

export interface AdminPromptsEditorState extends AdminPromptsDocumentState, AdminPromptsModelState {
  showMetrics: boolean;
  setShowMetrics: Dispatch<SetStateAction<boolean>>;
  diffView: boolean;
  setDiffView: Dispatch<SetStateAction<boolean>>;
  selectedTestId: number | null;
  setSelectedTestId: Dispatch<SetStateAction<number | null>>;
}

/**
 * Composes the prompt document state and the model request settings, and owns the
 * few view toggles that belong to neither.
 */
export function useAdminPromptsEditorState(): AdminPromptsEditorState {
  const document = useAdminPromptsDocumentState();
  const model = useAdminPromptsModelState();

  const [showMetrics, setShowMetrics] = useState(true);
  const [diffView, setDiffView] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);

  return {
    ...document,
    ...model,
    showMetrics,
    setShowMetrics,
    diffView,
    setDiffView,
    selectedTestId,
    setSelectedTestId,
  };
}
