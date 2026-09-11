import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import type { Key, ReactNode } from 'react';

export type AdminDataTableSortDirection = 'asc' | 'desc';

interface AdminDataTableColumn {
  id: string;
  header: ReactNode;
  className?: string;
  /** Передан — заголовок становится кнопкой сортировки. */
  onSort?: () => void;
  sortDirection?: AdminDataTableSortDirection | null;
}

interface AdminDataTableProps<TItem> {
  columns: AdminDataTableColumn[];
  items: TItem[];
  getRowKey: (item: TItem) => Key;
  renderRow: (item: TItem) => ReactNode;
  emptyMessage?: ReactNode;
  className?: string;
  emptyClassName?: string;
  getRowClassName?: (item: TItem) => string | undefined;
  onRowClick?: (item: TItem) => void;
  /**
   * Ограничивает высоту тела таблицы и прикрепляет шапку. Нужно там, где строк много: иначе при
   * прокрутке длинного списка колонки уезжают наверх и строка перестает читаться.
   */
  stickyHeader?: boolean;
}

const sortIcons = {
  asc: ArrowUp,
  desc: ArrowDown,
} as const;

const ariaSortValues = {
  asc: 'ascending',
  desc: 'descending',
} as const;

/**
 * Направление сортировки объявляется через `aria-sort` на самой ячейке заголовка, а кнопка
 * оставляет себе видимое название колонки: так скринридер читает «Попытка, по возрастанию», а не
 * подменяет заголовок служебной фразой.
 */
function AdminDataTableSortHeader({ column }: { column: AdminDataTableColumn }) {
  const SortIcon = column.sortDirection ? sortIcons[column.sortDirection] : ArrowUpDown;

  return (
    <button type="button" onClick={column.onSort} className={adminClassNames.table.sortButton}>
      {column.header}
      <SortIcon aria-hidden="true" className="size-3.5" />
    </button>
  );
}

export function AdminDataTable<TItem>({
  columns,
  items,
  getRowKey,
  renderRow,
  emptyMessage,
  className,
  emptyClassName,
  getRowClassName,
  onRowClick,
  stickyHeader = false,
}: AdminDataTableProps<TItem>) {
  return (
    <div
      className={cn(
        adminClassNames.table.container,
        stickyHeader ? adminClassNames.table.scrollBody : 'overflow-x-auto',
        className,
      )}
    >
      <Table>
        <TableHeader
          className={cn(
            adminClassNames.table.header,
            stickyHeader && adminClassNames.table.stickyHeader,
          )}
        >
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={column.className}
                aria-sort={
                  column.onSort
                    ? (column.sortDirection && ariaSortValues[column.sortDirection]) || 'none'
                    : undefined
                }
              >
                {column.onSort ? <AdminDataTableSortHeader column={column} /> : column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && emptyMessage ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className={cn(adminClassNames.table.emptyCell, emptyClassName)}
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : null}
          {items.map((item) => (
            <TableRow
              key={getRowKey(item)}
              className={cn(
                onRowClick ? adminClassNames.table.clickableRow : undefined,
                getRowClassName?.(item),
              )}
              onClick={() => onRowClick?.(item)}
            >
              {renderRow(item)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
