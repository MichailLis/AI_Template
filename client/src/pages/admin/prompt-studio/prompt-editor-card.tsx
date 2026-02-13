import { AlertTriangle, Plus, Sparkles, Trash2 } from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import type { DuplicateVariableData, ModelFilter, PromptVariable, ResponseFormat } from './types';
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
    <Card className="min-w-0 border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Prompt Editor
        </CardTitle>
        <CardDescription>
          First approximation for student career guidance prompt workflow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="prompt-model-search">Search models</Label>
            <Input
              id="prompt-model-search"
              value={modelSearch}
              onChange={(event) => onModelSearchChange(event.target.value)}
              placeholder="Search by name, id, or provider"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt-model">Model</Label>
            <select
              id="prompt-model"
              value={selectedModel}
              onChange={(event) => onModelChange(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {filteredModels.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={modelFilter === 'all' ? 'secondary' : 'outline'}
            onClick={() => onModelFilterChange('all')}
          >
            All
          </Button>
          <Button
            type="button"
            size="sm"
            variant={modelFilter === 'free' ? 'secondary' : 'outline'}
            onClick={() => onModelFilterChange('free')}
          >
            Free
          </Button>
          <Button
            type="button"
            size="sm"
            variant={modelFilter === 'paid' ? 'secondary' : 'outline'}
            onClick={() => onModelFilterChange('paid')}
          >
            Paid
          </Button>
          <p className="ml-auto text-xs text-slate-500">
            Showing {filteredModels.length} of {allModelsCount}
          </p>
        </div>

        {selectedModelItem ? (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
            <Badge
              variant="outline"
              className={
                selectedModelItem.isFree
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-300'
              }
            >
              {selectedModelItem.isFree ? 'FREE' : 'PAID'}
            </Badge>
            <span className="text-xs text-slate-600">Provider: {selectedModelItem.provider}</span>
            <span className="text-xs text-slate-600">
              Context: {selectedModelItem.contextLength ?? 'n/a'}
            </span>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="prompt-temperature">
              Temperature <span className="text-slate-500">({temperature})</span>
            </Label>
            <input
              id="prompt-temperature"
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              onChange={(event) => onTemperatureChange(event.target.value)}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt-max-tokens">Max tokens</Label>
            <Input
              id="prompt-max-tokens"
              value={maxTokens}
              onChange={(event) => onMaxTokensChange(event.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="prompt-system-role">System role</Label>
            <Input
              id="prompt-system-role"
              value={systemRole}
              onChange={(event) => onSystemRoleChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Response format</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={responseFormat === 'text' ? 'secondary' : 'outline'}
                onClick={() => onResponseFormatChange('text')}
              >
                Text
              </Button>
              <Button
                type="button"
                size="sm"
                variant={responseFormat === 'json' ? 'secondary' : 'outline'}
                onClick={() => onResponseFormatChange('json')}
              >
                JSON
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt-template">Prompt template</Label>
          <div className="grid grid-cols-[44px_minmax(0,1fr)] overflow-hidden rounded-md border border-input">
            <div className="overflow-hidden border-r border-slate-200 bg-slate-50 text-right">
              <div
                className="py-2 pr-2 font-mono text-[11px] leading-5 text-slate-400"
                style={{ transform: `translateY(-${promptEditorScrollTop}px)` }}
              >
                {Array.from({ length: promptLineCount }, (_, index) => (
                  <div key={`line-${index + 1}`}>{index + 1}</div>
                ))}
              </div>
            </div>
            <Textarea
              id="prompt-template"
              value={promptTemplate}
              onChange={(event) => onPromptTemplateChange(event.target.value)}
              onScroll={(event) => onPromptEditorScrollTopChange(event.currentTarget.scrollTop)}
              className="min-h-[280px] max-h-[360px] resize-y overflow-auto rounded-none border-0 font-mono text-xs leading-5 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

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
                  Duplicate variable keys detected: {duplicateVariableData.duplicateKeys.join(', ')}
                  . Keep each key unique to avoid ambiguous substitutions.
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
      </CardContent>
    </Card>
  );
}
