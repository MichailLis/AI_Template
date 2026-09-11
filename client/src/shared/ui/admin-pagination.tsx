import { ChevronLeft, ChevronRight } from 'lucide-react';

import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminSelectField } from '@/shared/ui/admin-select-field';
import { Button } from '@/shared/ui/button';

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  isFetching: boolean;
  onPrevious: () => void;
  onNext: () => void;
  /** Размер страницы показывается только там, где вызывающий готов его менять. */
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
}

export function AdminPagination({
  page,
  totalPages,
  isFetching,
  onPrevious,
  onNext,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}: AdminPaginationProps) {
  const canChangePageSize = Boolean(pageSize && pageSizeOptions?.length && onPageSizeChange);

  return (
    <div className={adminClassNames.pagination.root}>
      <div className="flex flex-wrap items-center gap-3">
        <p className={adminClassNames.pagination.badge}>
          Страница {page} из {totalPages}
        </p>

        {canChangePageSize ? (
          <label className={`flex items-center gap-2 text-sm ${adminClassNames.text.muted}`}>
            Строк на странице
            <AdminSelectField
              value={String(pageSize)}
              onChange={(event) => onPageSizeChange?.(Number.parseInt(event.target.value, 10))}
              className="h-9 w-20"
              aria-label="Строк на странице"
            >
              {pageSizeOptions?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </AdminSelectField>
          </label>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrevious} disabled={page <= 1 || isFetching}>
          <ChevronLeft />
          Назад
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={page >= totalPages || isFetching}
        >
          Далее
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
