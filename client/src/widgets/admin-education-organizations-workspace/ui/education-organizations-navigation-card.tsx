import { BarChart3, Link2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/shared/ui/button';

interface EducationOrganizationsNavigationCardProps {
  onCreateOrganization: () => void;
}

/**
 * Панель действий раздела, а не карточка: название и описание раздела уже стоят в шапке админки,
 * и отдельная карточка ради двух ссылок и одной кнопки занимала верх экрана впустую.
 */
export function EducationOrganizationsNavigationCard({
  onCreateOrganization,
}: EducationOrganizationsNavigationCardProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      <Button asChild type="button" variant="outline" size="sm" className="w-full sm:w-auto">
        <Link to="/admin/public-links">
          <Link2 aria-hidden="true" className="size-4" />К публичным ссылкам
        </Link>
      </Button>
      <Button asChild type="button" variant="outline" size="sm" className="w-full sm:w-auto">
        <Link to="/admin/analytics?tab=attempts">
          <BarChart3 aria-hidden="true" className="size-4" />К прохождениям
        </Link>
      </Button>
      <Button type="button" size="sm" className="w-full sm:w-auto" onClick={onCreateOrganization}>
        <Plus aria-hidden="true" className="size-4" />
        Добавить заведение
      </Button>
    </div>
  );
}
