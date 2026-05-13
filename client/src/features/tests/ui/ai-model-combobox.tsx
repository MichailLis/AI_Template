import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/shared/lib/utils';
import {
  adminBadgeClassNames,
  adminClassNames,
  adminToneClassNames,
} from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command';
import { Label } from '@/shared/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

import type { AiModelOption, ModelFilter } from '../model/use-ai-test-generation';

interface AiModelComboboxProps {
  allModelsCount: number;
  modelOptionsCount: number;
  visibleModelOptions: AiModelOption[];
  selectedModelItem: AiModelOption | null;
  selectedModelId: string;
  modelFilter: ModelFilter;
  isLoading: boolean;
  isError: boolean;
  onSelectModel: (modelId: string) => void;
  onModelFilterChange: (nextFilter: ModelFilter) => void;
  onRetryModels: () => void;
}

function ModelFilterButtons({
  modelFilter,
  onModelFilterChange,
}: {
  modelFilter: ModelFilter;
  onModelFilterChange: (nextFilter: ModelFilter) => void;
}) {
  return (
    <div className={`flex items-center gap-2 p-2 ${adminClassNames.border.bottom}`}>
      <Button
        type="button"
        size="sm"
        variant={modelFilter === 'free' ? 'secondary' : 'outline'}
        className={modelFilter === 'free' ? adminToneClassNames.success.active : undefined}
        onClick={() => onModelFilterChange('free')}
      >
        Только free
      </Button>
      <Button
        type="button"
        size="sm"
        variant={modelFilter === 'all' ? 'secondary' : 'outline'}
        className={modelFilter === 'all' ? adminToneClassNames.info.active : undefined}
        onClick={() => onModelFilterChange('all')}
      >
        Все
      </Button>
    </div>
  );
}

function ModelOptionItem({
  model,
  selectedModelId,
  onSelect,
}: {
  model: AiModelOption;
  selectedModelId: string;
  onSelect: (modelId: string) => void;
}) {
  return (
    <CommandItem
      value={`${model.label} ${model.id} ${model.provider}`}
      onSelect={() => onSelect(model.id)}
      className="gap-2"
    >
      <Check
        className={cn(
          'h-4 w-4 shrink-0',
          selectedModelId === model.id ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm">{model.label}</span>
        <span className={`truncate text-xs ${adminClassNames.text.muted}`}>
          {model.provider} · {model.id}
        </span>
      </div>
      {model.isFree ? (
        <Badge variant="outline" className={`shrink-0 ${adminBadgeClassNames.success}`}>
          Free
        </Badge>
      ) : null}
    </CommandItem>
  );
}

export function AiModelCombobox({
  allModelsCount,
  modelOptionsCount,
  visibleModelOptions,
  selectedModelItem,
  selectedModelId,
  modelFilter,
  isLoading,
  isError,
  onSelectModel,
  onModelFilterChange,
  onRetryModels,
}: AiModelComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <div className="flex flex-col gap-2" ref={setContainer}>
      <Label htmlFor="ai-model-selector">Модель ИИ</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="ai-model-selector"
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="h-9 w-full justify-between"
            disabled={isLoading || modelOptionsCount === 0}
          >
            <span className="truncate text-left">
              {selectedModelItem
                ? `${selectedModelItem.label}${selectedModelItem.isFree ? ' (Free)' : ''}`
                : 'Выберите модель ИИ'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={`w-[420px] max-w-[calc(100vw-3rem)] p-0 ${adminClassNames.dialog.content}`}
          align="start"
          container={container}
        >
          <Command>
            <ModelFilterButtons
              modelFilter={modelFilter}
              onModelFilterChange={onModelFilterChange}
            />
            <CommandInput placeholder="Поиск модели по названию, id или провайдеру" />
            <CommandList>
              <CommandEmpty>Модели не найдены</CommandEmpty>
              <CommandGroup heading={`Доступные модели (${visibleModelOptions.length})`}>
                {visibleModelOptions.map((model) => (
                  <ModelOptionItem
                    key={model.id}
                    model={model}
                    selectedModelId={selectedModelId}
                    onSelect={(modelId) => {
                      onSelectModel(modelId);
                      setIsOpen(false);
                    }}
                  />
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <p className={adminClassNames.form.fieldHint}>
        Показано {visibleModelOptions.length} из {modelOptionsCount} моделей с поддержкой structured
        outputs
      </p>

      {!isLoading && modelOptionsCount === 0 ? (
        <p className={`text-xs ${adminToneClassNames.warning.text}`}>
          Нет моделей с поддержкой structured outputs.
        </p>
      ) : null}

      <p className={adminClassNames.form.fieldHint}>Всего в каталоге: {allModelsCount}</p>

      {isError ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetryModels}>
          Повторить загрузку моделей
        </Button>
      ) : null}
    </div>
  );
}
