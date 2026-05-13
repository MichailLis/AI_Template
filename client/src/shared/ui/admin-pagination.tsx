import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <p className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
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
