import { cn } from '@/shared/lib/utils';
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
    <div
      className={cn('overflow-hidden rounded-lg border border-border bg-card shadow-sm', className)}
    >
      <Table>
        <TableHeader className="bg-muted/50">
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
                className={cn('py-12 text-center text-sm text-muted-foreground', emptyClassName)}
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : null}
          {items.map((item) => (
            <TableRow
              key={getRowKey(item)}
              className={cn(
                onRowClick ? 'cursor-pointer hover:bg-muted/40' : undefined,
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
