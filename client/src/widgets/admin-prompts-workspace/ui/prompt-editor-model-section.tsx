import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminSelectField } from '@/shared/ui/admin-select-field';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import type { ModelFilter } from '../model/types';
import type { AdminPromptModelsResponseDtoModelsItem } from '@/shared/api/model';

interface PromptEditorModelSectionProps {
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
}: PromptEditorModelSectionProps) {
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
            disabled={filteredModels.length === 0}
          >
            {filteredModels.length === 0 ? <option value="">Нет моделей</option> : null}
            {filteredModels.map((item) => (
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
            {selectedModelItem.isFree ? 'FREE' : 'PAID'}
          </Badge>
          <span className={`text-xs ${adminClassNames.text.body}`}>
            Поставщик: {selectedModelItem.provider}
          </span>
          <span className={`text-xs ${adminClassNames.text.body}`}>
            Контекст: {selectedModelItem.contextLength ?? 'н/д'}
          </span>
          <Badge variant="outline" className={adminBadgeClassNames.info}>
            STRUCTURED OUTPUTS
          </Badge>
        </div>
      ) : null}
    </>
  );
}
