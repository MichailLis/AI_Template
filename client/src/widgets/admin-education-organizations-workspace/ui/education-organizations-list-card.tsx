import { AdminDataTable } from '@/shared/ui/admin-data-table';
import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminPagination } from '@/shared/ui/admin-pagination';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { TableCell } from '@/shared/ui/table';

import { modeLabel } from './admin-education-organizations-workspace.helpers';

import type { AdminEducationOrganizationsListResponseDtoOrganizationsItem } from '@/shared/api/model';

interface EducationOrganizationsListCardProps {
  organizations: AdminEducationOrganizationsListResponseDtoOrganizationsItem[];
  selectedOrganizationId: number | null;
  page: number;
  total: number;
  totalPages: number;
  isFetching: boolean;
  onSelectOrganization: (
    organization: AdminEducationOrganizationsListResponseDtoOrganizationsItem,
  ) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

const EDUCATION_ORGANIZATIONS_COLUMNS = [
  { id: 'organization', header: 'Заведение' },
  { id: 'mode', header: 'Режим' },
  { id: 'links', header: 'Ссылки' },
  { id: 'attempts', header: 'Попытки' },
  { id: 'status', header: 'Статус' },
];

export function EducationOrganizationsListCard({
  organizations,
  selectedOrganizationId,
  page,
  total,
  totalPages,
  isFetching,
  onSelectOrganization,
  onPreviousPage,
  onNextPage,
}: EducationOrganizationsListCardProps) {
  return (
    <Card className={adminClassNames.panel.card}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Список заведений</CardTitle>
        <CardDescription>
          Всего: {total}. Нажмите на строку, чтобы открыть настройки.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AdminDataTable
          columns={EDUCATION_ORGANIZATIONS_COLUMNS}
          items={organizations}
          getRowKey={(organization) => organization.id}
          getRowClassName={(organization) =>
            selectedOrganizationId === organization.id
              ? adminClassNames.panel.selectedRow
              : undefined
          }
          onRowClick={onSelectOrganization}
          emptyMessage="Пока нет учебных заведений"
          renderRow={(organization) => (
            <>
              <TableCell className="font-medium">{organization.name}</TableCell>
              <TableCell>{modeLabel[organization.groupValidationMode]}</TableCell>
              <TableCell>{`${organization.activeLinksCount}/${organization.linksCount}`}</TableCell>
              <TableCell>{organization.attemptsCount}</TableCell>
              <TableCell>
                {organization.isActive ? (
                  <span className={adminBadgeClassNames.pillSuccess}>Активно</span>
                ) : (
                  <span className={adminBadgeClassNames.pillNeutral}>Отключено</span>
                )}
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
