import { AdminListToolbar } from '@/shared/ui/admin-list-toolbar';
import { Button } from '@/shared/ui/button';

interface TestsListHeaderProps {
  searchValue: string;
  listMode: 'active' | 'archived';
  onSearchChange: (value: string) => void;
  onListModeChange: (mode: 'active' | 'archived') => void;
  onOpenCreateModal: () => void;
  onOpenAiGenerator: () => void;
  onImportProfOrientation: () => void;
  isImportingProfOrientation: boolean;
}

export function TestsListHeader({
  searchValue,
  listMode,
  onSearchChange,
  onListModeChange,
  onOpenCreateModal,
  onOpenAiGenerator,
  onImportProfOrientation,
  isImportingProfOrientation,
}: TestsListHeaderProps) {
  return (
    <AdminListToolbar
      title="Тесты"
      description="Создание и управление тестами"
      searchId="tests-search"
      searchValue={searchValue}
      searchPlaceholder="Поиск по названию теста"
      activeTab={listMode}
      tabs={[
        { value: 'active', label: 'Активные' },
        { value: 'archived', label: 'Архив' },
      ]}
      actions={
        <>
          <Button type="button" variant="outline" onClick={onOpenAiGenerator}>
            Сгенерировать с ИИ
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isImportingProfOrientation}
            onClick={onImportProfOrientation}
          >
            {isImportingProfOrientation ? 'Импортируем...' : 'Импорт v3+'}
          </Button>
          <Button type="button" onClick={onOpenCreateModal}>
            Создать
          </Button>
        </>
      }
      onTabChange={onListModeChange}
      onSearchChange={onSearchChange}
    />
  );
}
