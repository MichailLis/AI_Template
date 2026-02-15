import { Button } from '@/shared/ui/button';

interface AdminUsersPaginationProps {
  page: number;
  totalPages: number;
  isFetching: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function AdminUsersPagination({
  page,
  totalPages,
  isFetching,
  onPrevious,
  onNext,
}: AdminUsersPaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
      <p className="text-sm text-slate-500">
        Страница {page} из {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrevious} disabled={page <= 1 || isFetching}>
          Назад
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={page >= totalPages || isFetching}
        >
          Далее
        </Button>
      </div>
    </div>
  );
}
