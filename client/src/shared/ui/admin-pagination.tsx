import { ChevronLeft, ChevronRight } from 'lucide-react';

import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  isFetching: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function AdminPagination({
  page,
  totalPages,
  isFetching,
  onPrevious,
  onNext,
}: AdminPaginationProps) {
  return (
    <div className={adminClassNames.pagination.root}>
      <p className={adminClassNames.pagination.badge}>
        Страница {page} из {totalPages}
      </p>
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
