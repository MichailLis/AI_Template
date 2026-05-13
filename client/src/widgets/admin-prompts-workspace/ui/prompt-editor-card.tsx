import { Sparkles } from 'lucide-react';

import {
  adminBadgeClassNames,
  adminClassNames,
  adminToneClassNames,
} from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import { PromptEditorModelSection } from './prompt-editor-model-section';
import { PromptEditorSettingsSection } from './prompt-editor-settings-section';
import { PromptEditorTemplateSection } from './prompt-editor-template-section';
import { PromptEditorVariablesSection } from './prompt-editor-variables-section';

import type {
  DuplicateVariableData,
  ModelFilter,
  PromptVariable,
  ResponseFormat,
} from '../model/types';
import type { AdminPromptModelsResponseDtoModelsItem } from '@/shared/api/model';

interface PromptEditorCardProps {
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
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`grid size-10 shrink-0 place-items-center rounded-xl ${adminToneClassNames.info.icon}`}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle>Редактор промптов</CardTitle>
              <CardDescription>
                Черновой сценарий для студенческих карьерных траекторий.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={adminBadgeClassNames.info}>
            Structured outputs
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
