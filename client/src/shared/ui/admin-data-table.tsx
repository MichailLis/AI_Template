import { cn } from '@/shared/lib/utils';
import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import type { Key, ReactNode } from 'react';

interface AdminDataTableColumn {
  id: string;
  header: ReactNode;
  className?: string;
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
}: AdminDataTableProps<TItem>) {
  return (
    <div className={cn(adminClassNames.table.container, 'overflow-x-auto', className)}>
      <Table>
        <TableHeader className={adminClassNames.table.header}>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id} className={column.className}>
                {column.header}
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
