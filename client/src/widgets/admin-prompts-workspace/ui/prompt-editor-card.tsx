import { Sparkles } from 'lucide-react';

import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import { PromptEditorModelSection } from './prompt-editor-model-section';
import { PromptEditorSettingsSection } from './prompt-editor-settings-section';
import { PromptEditorTemplateSection } from './prompt-editor-template-section';
import { PromptEditorVariablesSection } from './prompt-editor-variables-section';

import type { PromptModelMismatch } from './admin-prompts-workspace.helpers';
import type {
  DuplicateVariableData,
  ModelFilter,
  PromptVariable,
  ResponseFormat,
} from '../model/types';
import type { AdminPromptModelsResponseDtoModelsItem } from '@/shared/api/model';

interface EditingPrompt {
  title: string;
  versionNumber: number | null;
}

const getEditorTitle = (editingPrompt: EditingPrompt | null) => {
  if (!editingPrompt) {
    return 'Новый промпт';
  }

  const version = editingPrompt.versionNumber ? ` (v${editingPrompt.versionNumber})` : '';

  return `Редактирование: ${editingPrompt.title}${version}`;
};

interface PromptEditorCardProps {
  /** Сохраненный промпт в редакторе; `null` — пишется новый. */
  editingPrompt: EditingPrompt | null;
  modelMismatch: PromptModelMismatch | null;
  modelSearch: string;
  onModelSearchChange: (value: string) => void;
  modelFilter: ModelFilter;
  onModelFilterChange: (value: ModelFilter) => void;
  filteredModels: AdminPromptModelsResponseDtoModelsItem[];
  allModelsCount: number;
  selectedModel: string;
  onModelChange: (value: string) => void;
  selectedModelItem: AdminPromptModelsResponseDtoModelsItem | null;
  temperature: string;
  onTemperatureChange: (value: string) => void;
  systemRole: string;
  onSystemRoleChange: (value: string) => void;
  maxTokens: string;
  onMaxTokensChange: (value: string) => void;
  responseFormat: ResponseFormat;
  onResponseFormatChange: (value: ResponseFormat) => void;
  promptTemplate: string;
  onPromptTemplateChange: (value: string) => void;
  promptLineCount: number;
  promptEditorScrollTop: number;
  onPromptEditorScrollTopChange: (value: number) => void;
  variables: PromptVariable[];
  duplicateVariableData: DuplicateVariableData;
  onVariableChange: (variableId: string, field: 'key' | 'value', value: string) => void;
  onAddVariable: () => void;
  onRemoveVariable: (variableId: string) => void;
}

export function PromptEditorCard({
  editingPrompt,
  modelMismatch,
  modelSearch,
  onModelSearchChange,
  modelFilter,
  onModelFilterChange,
  filteredModels,
  allModelsCount,
  selectedModel,
  onModelChange,
  selectedModelItem,
  temperature,
  onTemperatureChange,
  systemRole,
  onSystemRoleChange,
  maxTokens,
  onMaxTokensChange,
  responseFormat,
  onResponseFormatChange,
  promptTemplate,
  onPromptTemplateChange,
  promptLineCount,
  promptEditorScrollTop,
  onPromptEditorScrollTopChange,
  variables,
  duplicateVariableData,
  onVariableChange,
  onAddVariable,
  onRemoveVariable,
}: PromptEditorCardProps) {
  return (
    <Card className={`min-w-0 ${adminClassNames.panel.card}`}>
      <CardHeader className={adminClassNames.border.bottom}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 shrink-0 text-admin-muted" />
              {getEditorTitle(editingPrompt)}
            </CardTitle>
            <CardDescription>
              {editingPrompt
                ? 'Изменения сохранятся новой версией этого промпта.'
                : 'Промпт сохранится как новый сценарий анализа.'}
            </CardDescription>
          </div>
          <Badge variant="outline" className={adminBadgeClassNames.info}>
            Структурированный ответ
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-4">
        <PromptEditorModelSection
          modelSearch={modelSearch}
          onModelSearchChange={onModelSearchChange}
          modelFilter={modelFilter}
          onModelFilterChange={onModelFilterChange}
          filteredModels={filteredModels}
          allModelsCount={allModelsCount}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          selectedModelItem={selectedModelItem}
          modelMismatch={modelMismatch}
        />

        <PromptEditorSettingsSection
          temperature={temperature}
          onTemperatureChange={onTemperatureChange}
          systemRole={systemRole}
          onSystemRoleChange={onSystemRoleChange}
          maxTokens={maxTokens}
          onMaxTokensChange={onMaxTokensChange}
          responseFormat={responseFormat}
          onResponseFormatChange={onResponseFormatChange}
        />

        <PromptEditorTemplateSection
          promptTemplate={promptTemplate}
          onPromptTemplateChange={onPromptTemplateChange}
          promptLineCount={promptLineCount}
          promptEditorScrollTop={promptEditorScrollTop}
          onPromptEditorScrollTopChange={onPromptEditorScrollTopChange}
        />

        <PromptEditorVariablesSection
          variables={variables}
          duplicateVariableData={duplicateVariableData}
          onVariableChange={onVariableChange}
          onAddVariable={onAddVariable}
          onRemoveVariable={onRemoveVariable}
        />
      </CardContent>
    </Card>
  );
}
