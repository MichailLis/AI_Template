import { AlertTriangle, Plus, Trash2 } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { adminClassNames } from '@/shared/ui/admin-design-tokens';
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
    <div className={`flex flex-col gap-2 ${adminClassNames.panel.compactSection}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className={`text-xs font-semibold uppercase ${adminClassNames.text.body}`}>
          Тестовые переменные ({variables.length})
        </p>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className={`min-w-0 ${adminClassNames.form.fieldHint}`}>
            Вопросы для проверки берутся из выбранного теста справа.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={onAddVariable}
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить переменную
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        {variables.length === 0 ? (
          <div className={`p-3 text-xs ${adminClassNames.panel.empty}`}>
            Нет тестовых переменных. Добавьте одну для подстановки.
          </div>
        ) : null}

        {duplicateVariableData.duplicateKeys.length > 0 ? (
          <div
            className={`flex items-start gap-2 p-3 text-xs ${adminClassNames.panel.warningInline}`}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <span>
              Обнаружены дубликаты ключей: {duplicateVariableData.duplicateKeys.join(', ')}. Каждому
              ключу уникальное значение, чтобы избежать неоднозначной подстановки.
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
              className={cn(
                'font-mono text-xs',
                duplicateVariableData.duplicateIds.has(variable.id)
                  ? adminClassNames.form.warningInput
                  : '',
              )}
              placeholder="ключ_переменной"
            />
            <Input
              value={variable.value}
              onChange={(event) => onVariableChange(variable.id, 'value', event.target.value)}
              className="font-mono text-xs"
              placeholder="Значение переменной"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={adminClassNames.iconButton.danger}
              onClick={() => onRemoveVariable(variable.id)}
              aria-label={`Удалить переменную ${variable.key}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
