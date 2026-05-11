import { createVariableId } from '../lib/utils';

import type { UseAdminPromptsActionsParams } from './use-admin-prompts-actions.types';

export function useAdminPromptsVariableActions({
  variables,
  setVariables,
}: Pick<UseAdminPromptsActionsParams, 'variables' | 'setVariables'>) {
  const updateVariable = (variableId: string, field: 'key' | 'value', value: string) => {
    setVariables((prev) =>
      prev.map((item) => {
        if (item.id !== variableId) {
          return item;
        }

        return field === 'key' ? { ...item, key: value } : { ...item, value };
      }),
    );
  };

  const addVariable = () => {
    const nextIndex = variables.length + 1;
    setVariables((prev) => [
      ...prev,
      { id: createVariableId(), key: `variable_${nextIndex}`, value: '' },
    ]);
  };

  const removeVariable = (variableId: string) => {
    setVariables((prev) => prev.filter((item) => item.id !== variableId));
  };

  return { updateVariable, addVariable, removeVariable };
}
