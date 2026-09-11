import { cn } from '@/shared/lib/utils';

interface AdminSkeletonRowsProps {
  /** Сколько строк-заглушек показать: столько же, сколько обычно приходит данных. */
  rows?: number;
  columns?: number;
  className?: string;
  label?: string;
}

/**
 * Заглушка загрузки формой будущего содержимого. Текстовое «Загружаем...» заставляло макет
 * прыгать при каждом переходе: блок в одну строку сменялся таблицей на пол-экрана.
 */
export function AdminSkeletonRows({
  rows = 5,
  columns = 4,
  className,
  label = 'Загружаем данные',
}: AdminSkeletonRowsProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)} role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-3">
          {Array.from({ length: columns }, (_, columnIndex) => (
            <div
              key={columnIndex}
              className={cn(
                'h-8 animate-pulse rounded-md bg-admin-panel-muted',
                columnIndex === 0 ? 'w-24' : 'flex-1',
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
