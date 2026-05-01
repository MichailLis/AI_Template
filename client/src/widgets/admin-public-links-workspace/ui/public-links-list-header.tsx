import { Link } from 'react-router-dom';

import { AdminListToolbar } from '@/shared/ui/admin-list-toolbar';
import { Button } from '@/shared/ui/button';

import type { PublicLinksTab } from './admin-public-links-workspace.helpers';

interface PublicLinksListHeaderProps {
  publicLinksTab: PublicLinksTab;
  searchValue: string;
  onSwitchPublicLinksTab: (tab: PublicLinksTab) => void;
  onSearchChange: (value: string) => void;
  onOpenCreateDialog: () => void;
}

export function PublicLinksListHeader({
  publicLinksTab,
  searchValue,
  onSwitchPublicLinksTab,
  onSearchChange,
  onOpenCreateDialog,
}: PublicLinksListHeaderProps) {
  return (
    <AdminListToolbar
      title="Публичные ссылки"
      description="Публикация тестов и управление доступом"
      searchId="public-links-search"
      searchValue={searchValue}
      searchPlaceholder="Поиск по коду, тесту или заведению"
      activeTab={publicLinksTab}
      tabs={[
        { value: 'active', label: 'Активные' },
        { value: 'archived', label: 'Архив' },
      ]}
      actions={
        <>
          <Button asChild type="button" variant="outline">
            <Link to="/admin/public-links/organizations">Учебные заведения</Link>
          </Button>
          <Button asChild type="button" variant="outline">
            <Link to="/admin/public-links/stats">Статистика</Link>
          </Button>
          <Button type="button" onClick={onOpenCreateDialog}>
            Создать
          </Button>
        </>
      }
      onTabChange={onSwitchPublicLinksTab}
      onSearchChange={onSearchChange}
    />
  );
}
