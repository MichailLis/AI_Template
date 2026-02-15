import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { modeLabel } from './admin-education-organizations-workspace.helpers';

import type { AdminEducationOrganizationsListResponseDtoOrganizationsItem } from '@/shared/api/model';

interface EducationOrganizationsListCardProps {
  organizations: AdminEducationOrganizationsListResponseDtoOrganizationsItem[];
  selectedOrganizationId: number | null;
  onSelectOrganization: (
    organization: AdminEducationOrganizationsListResponseDtoOrganizationsItem,
  ) => void;
}

export function EducationOrganizationsListCard({
  organizations,
  selectedOrganizationId,
  onSelectOrganization,
}: EducationOrganizationsListCardProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Список заведений</CardTitle>
        <CardDescription>
          Всего: {organizations.length}. Нажмите на строку, чтобы открыть настройки.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Заведение</TableHead>
              <TableHead>Режим</TableHead>
              <TableHead>Ссылки</TableHead>
              <TableHead>Попытки</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500">
                  Пока нет учебных заведений
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((organization) => {
                const isSelected = selectedOrganizationId === organization.id;

                return (
                  <TableRow
                    key={organization.id}
                    className={isSelected ? 'bg-slate-100' : undefined}
                    onClick={() => onSelectOrganization(organization)}
                  >
                    <TableCell className="font-medium">{organization.name}</TableCell>
                    <TableCell>{modeLabel[organization.groupValidationMode]}</TableCell>
                    <TableCell>{`${organization.activeLinksCount}/${organization.linksCount}`}</TableCell>
                    <TableCell>{organization.attemptsCount}</TableCell>
                    <TableCell>
                      {organization.isActive ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                          Активно
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
                          Отключено
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
