import { cn } from '@/shared/lib/utils';
import {
  adminBadgeClassNames,
  adminClassNames,
  adminToneClassNames,
} from '@/shared/ui/admin-design-tokens';
import { AdminSelectField } from '@/shared/ui/admin-select-field';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import type { PromptModelMismatch } from './admin-prompts-workspace.helpers';
import type { ModelFilter } from '../model/types';
import type { AdminPromptModelsResponseDtoModelsItem } from '@/shared/api/model';

interface PromptEditorModelSectionProps {
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
}

/** Предупреждение о смене модели сохраненного промпта: новая версия незаметно сменила бы модель анализа. */
function PromptModelMismatchNotice({
  modelMismatch,
  onModelChange,
}: {
  modelMismatch: PromptModelMismatch;
  onModelChange: (value: string) => void;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-md border p-3 text-sm sm:flex-row sm:items-center sm:justify-between',
        adminToneClassNames.warning.border,
        adminToneClassNames.warning.surface,
      )}
    >
      <p className={adminClassNames.text.body}>
        {`Модель отличается от сохраненной в v${modelMismatch.versionNumber}: ${modelMismatch.savedModel}. Новая версия сохранится с выбранной моделью.`}
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0"
        onClick={() => onModelChange(modelMismatch.savedModel)}
      >
        {`Вернуть модель v${modelMismatch.versionNumber}`}
      </Button>
    </div>
  );
}

export function PromptEditorModelSection({
  modelSearch,
  onModelSearchChange,
  modelFilter,
  onModelFilterChange,
  filteredModels,
  allModelsCount,
  selectedModel,
  onModelChange,
  selectedModelItem,
  modelMismatch,
}: PromptEditorModelSectionProps) {
  // Выбранная модель остается в списке, даже если текущий фильтр ее скрывает: иначе поле
  // показывало бы другую модель, чем та, что будет сохранена.
  const hiddenSelectedModel =
    selectedModelItem && !filteredModels.some((item) => item.id === selectedModelItem.id)
      ? selectedModelItem
      : null;
  const modelOptions = hiddenSelectedModel
    ? [hiddenSelectedModel, ...filteredModels]
    : filteredModels;

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="prompt-model-search">Поиск моделей</Label>
          <Input
            id="prompt-model-search"
            value={modelSearch}
            onChange={(event) => onModelSearchChange(event.target.value)}
            placeholder="Поиск по названию, ID или поставщику"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prompt-model">Модель</Label>
          <AdminSelectField
            id="prompt-model"
            value={selectedModel}
            onChange={(event) => onModelChange(event.target.value)}
            disabled={modelOptions.length === 0}
          >
            {modelOptions.length === 0 ? <option value="">Нет моделей</option> : null}
            {modelOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </AdminSelectField>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={modelFilter === 'all' ? 'secondary' : 'outline'}
          onClick={() => onModelFilterChange('all')}
        >
          Все
        </Button>
        <Button
          type="button"
          size="sm"
          variant={modelFilter === 'free' ? 'secondary' : 'outline'}
          onClick={() => onModelFilterChange('free')}
        >
          Бесплатные
        </Button>
        <Button
          type="button"
          size="sm"
          variant={modelFilter === 'paid' ? 'secondary' : 'outline'}
          onClick={() => onModelFilterChange('paid')}
        >
          Платные
        </Button>
        <p className={`ml-auto ${adminClassNames.form.fieldHint}`}>
          Показано {filteredModels.length} из {allModelsCount}
        </p>
      </div>

      {selectedModelItem ? (
        <div
          className={`flex flex-wrap items-center gap-2 p-2 ${adminClassNames.panel.compactSection}`}
        >
          <Badge
            variant="outline"
            className={
              selectedModelItem.isFree ? adminBadgeClassNames.success : adminBadgeClassNames.neutral
            }
          >
            {selectedModelItem.isFree ? 'Бесплатная' : 'Платная'}
          </Badge>
          <span className={`text-xs ${adminClassNames.text.body}`}>
            Поставщик: {selectedModelItem.provider}
          </span>
          <span className={`text-xs ${adminClassNames.text.body}`}>
            Контекст: {selectedModelItem.contextLength ?? 'н/д'}
          </span>
          <Badge variant="outline" className={adminBadgeClassNames.info}>
            Структурированный ответ
          </Badge>
        </div>
      ) : null}

      {modelMismatch ? (
        <PromptModelMismatchNotice modelMismatch={modelMismatch} onModelChange={onModelChange} />
      ) : null}
    </>
  );
}
