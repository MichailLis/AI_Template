import { Link } from 'react-router-dom';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

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
    <div className="space-y-4 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Публичные ссылки</h1>
          <p className="text-sm text-slate-500">Публикация тестов и управление доступом</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild type="button" variant="outline">
            <Link to="/admin/public-links/organizations">Учебные заведения</Link>
          </Button>
          <Button asChild type="button" variant="outline">
            <Link to="/admin/public-links/stats">Статистика</Link>
          </Button>
          <Button type="button" onClick={onOpenCreateDialog}>
            Создать
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit rounded-md border border-slate-200 bg-white p-1">
          <Button
            type="button"
            size="sm"
            variant={publicLinksTab === 'active' ? 'secondary' : 'ghost'}
            onClick={() => onSwitchPublicLinksTab('active')}
          >
            Активные
          </Button>
          <Button
            type="button"
            size="sm"
            variant={publicLinksTab === 'archived' ? 'secondary' : 'ghost'}
            onClick={() => onSwitchPublicLinksTab('archived')}
          >
            Архив
          </Button>
        </div>

        <div className="w-full max-w-md">
          <Input
            id="public-links-search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Поиск по коду, тесту или заведению"
          />
        </div>
      </div>
    </div>
  );
}
