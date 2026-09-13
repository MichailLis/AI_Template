import { Pencil } from 'lucide-react';

import { GROUP_VALIDATION_MODE_LABELS } from '@/shared/lib/group-validation';
import { AdminDataTable } from '@/shared/ui/admin-data-table';
import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminPagination } from '@/shared/ui/admin-pagination';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/shared/ui/card';
import { TableCell } from '@/shared/ui/table';

import type { AdminEducationOrganizationsListResponseDtoOrganizationsItem } from '@/shared/api/model';

interface EducationOrganizationsListCardProps {
  organizations: AdminEducationOrganizationsListResponseDtoOrganizationsItem[];
  page: number;
  total: number;
  totalPages: number;
  isFetching: boolean;
  onEditOrganization: (
    organization: AdminEducationOrganizationsListResponseDtoOrganizationsItem,
  ) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

const EDUCATION_ORGANIZATIONS_COLUMNS = [
  { id: 'organization', header: 'Заведение' },
  { id: 'mode', header: 'Формат группы', className: 'hidden md:table-cell' },
  { id: 'links', header: 'Ссылки: активные / всего', className: 'whitespace-nowrap' },
  { id: 'attempts', header: 'Попытки', className: 'hidden md:table-cell' },
  { id: 'personal-data', header: 'Персональные данные', className: 'whitespace-nowrap' },
  { id: 'status', header: 'Статус' },
  { id: 'actions', header: 'Действия', className: 'text-right' },
];

export function EducationOrganizationsListCard({
  organizations,
  page,
  total,
  totalPages,
  isFetching,
  onEditOrganization,
  onPreviousPage,
  onNextPage,
}: EducationOrganizationsListCardProps) {
  return (
    <Card className={adminClassNames.panel.card}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardDescription>{`Всего заведений: ${total}`}</CardDescription>
          {isFetching ? (
            <Badge variant="outline" className={adminBadgeClassNames.info}>
              Обновляем
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AdminDataTable
          columns={EDUCATION_ORGANIZATIONS_COLUMNS}
          items={organizations}
          getRowKey={(organization) => organization.id}
          emptyMessage="Пока нет учебных заведений"
          renderRow={(organization) => (
            <>
              <TableCell
                className={`max-w-56 truncate font-medium ${adminClassNames.text.heading}`}
              >
                {organization.name}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {GROUP_VALIDATION_MODE_LABELS[organization.groupValidationMode]}
              </TableCell>
              <TableCell>{`${organization.activeLinksCount}/${organization.linksCount}`}</TableCell>
              <TableCell className="hidden md:table-cell">{organization.attemptsCount}</TableCell>
              <TableCell>
                {organization.personalDataReady ? (
                  <span className={adminBadgeClassNames.pillSuccess}>Реквизиты заполнены</span>
                ) : (
                  /* Незаполненные реквизиты блокируют публикацию от имени заведения — это
                     предупреждение, а не нейтральное состояние. Последствие написано рядом:
                     обычные ссылки у такого заведения работают, поэтому один бейдж вводил в
                     заблуждение. */
                  <div className="flex flex-col items-start gap-1">
                    <span className={adminBadgeClassNames.pillWarning}>Реквизиты не заполнены</span>
                    <span className={`text-xs ${adminClassNames.text.muted}`}>
                      Ссылки от имени заведения недоступны
                    </span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {organization.isActive ? (
                  <span className={adminBadgeClassNames.pillSuccess}>Активно</span>
                ) : (
                  <span className={adminBadgeClassNames.pillNeutral}>Отключено</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="whitespace-nowrap"
                  aria-label={`Редактировать ${organization.name}`}
                  title={`Редактировать ${organization.name}`}
                  onClick={() => onEditOrganization(organization)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  <span className="hidden lg:inline">Редактировать</span>
                </Button>
              </TableCell>
            </>
          )}
        />

        {total > 0 ? (
          <AdminPagination
            page={page}
            totalPages={totalPages}
            isFetching={isFetching}
            onPrevious={onPreviousPage}
            onNext={onNextPage}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
