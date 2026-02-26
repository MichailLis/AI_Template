import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

interface TestsListHeaderProps {
  searchValue: string;
  listMode: 'active' | 'archived';
  onSearchChange: (value: string) => void;
  onListModeChange: (mode: 'active' | 'archived') => void;
  onOpenCreateModal: () => void;
  onOpenAiGenerator: () => void;
}

export function TestsListHeader({
  searchValue,
  listMode,
  onSearchChange,
  onListModeChange,
  onOpenCreateModal,
  onOpenAiGenerator,
}: TestsListHeaderProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Тесты</h1>
          <p className="text-sm text-slate-500">Создание и управление тестами</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onOpenAiGenerator}>
            Сгенерировать с ИИ
          </Button>
          <Button type="button" onClick={onOpenCreateModal}>
            Создать
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit rounded-md border border-slate-200 bg-white p-1">
          <Button
            type="button"
            size="sm"
            variant={listMode === 'active' ? 'secondary' : 'ghost'}
            onClick={() => onListModeChange('active')}
          >
            Активные
          </Button>
          <Button
            type="button"
            size="sm"
            variant={listMode === 'archived' ? 'secondary' : 'ghost'}
            onClick={() => onListModeChange('archived')}
          >
            Архив
          </Button>
        </div>

        <div className="w-full max-w-md">
          <Input
            id="tests-search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Поиск по названию теста"
          />
        </div>
      </div>
    </div>
  );
}
