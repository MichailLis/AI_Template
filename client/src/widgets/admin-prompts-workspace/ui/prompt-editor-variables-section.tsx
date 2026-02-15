import { AlertTriangle, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import type { DuplicateVariableData, PromptVariable } from '../model/types';

interface PromptEditorVariablesSectionProps {
  variables: PromptVariable[];
  duplicateVariableData: DuplicateVariableData;
  onVariableChange: (variableId: string, field: 'key' | 'value', value: string) => void;
  onAddVariable: () => void;
  onRemoveVariable: (variableId: string) => void;
}

export function PromptEditorVariablesSection({
  variables,
  duplicateVariableData,
  onVariableChange,
  onAddVariable,
  onRemoveVariable,
}: PromptEditorVariablesSectionProps) {
  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase text-slate-600">
          Test Variables ({variables.length})
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-500">
            Question system is not connected yet, using manual values.
          </p>
          <Button type="button" size="sm" variant="outline" onClick={onAddVariable}>
            <Plus className="mr-2 h-4 w-4" />
            Add variable
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        {variables.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 p-3 text-xs text-slate-500">
            No test variables. Add one to inject placeholders.
          </div>
        ) : null}

        {duplicateVariableData.duplicateKeys.length > 0 ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <span>
              Duplicate variable keys detected: {duplicateVariableData.duplicateKeys.join(', ')}.
              Keep each key unique to avoid ambiguous substitutions.
            </span>
          </div>
        ) : null}

        {variables.map((variable) => (
          <div
            key={variable.id}
            className="grid items-center gap-2 md:grid-cols-[170px_minmax(0,1fr)_auto]"
          >
            <Input
              value={variable.key}
              onChange={(event) => onVariableChange(variable.id, 'key', event.target.value)}
              className={`font-mono text-xs ${
                duplicateVariableData.duplicateIds.has(variable.id)
                  ? 'border-amber-300 bg-amber-50 focus-visible:ring-amber-400'
                  : ''
              }`}
              placeholder="variable_key"
            />
            <Input
              value={variable.value}
              onChange={(event) => onVariableChange(variable.id, 'value', event.target.value)}
              className="font-mono text-xs"
              placeholder="Variable value"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onRemoveVariable(variable.id)}
              aria-label={`Remove variable ${variable.key}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
