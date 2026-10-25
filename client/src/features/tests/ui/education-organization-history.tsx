import { useTestsAdminEducationOrganizationsControllerGetEducationOrganizationHistory } from '@/shared/api/generated/tests/tests';
import { AuditHistoryList } from '@/shared/ui/audit-history-list';

/** История заведения: кто и когда менял реквизиты, которые попадают в согласие ученика. */
export function EducationOrganizationHistory({ organizationId }: { organizationId: number }) {
  const historyQuery =
    useTestsAdminEducationOrganizationsControllerGetEducationOrganizationHistory(organizationId);

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium">История изменений</h3>
      <AuditHistoryList
        events={historyQuery.data?.events}
        isLoading={historyQuery.isLoading}
        isError={historyQuery.isError}
      />
    </section>
  );
}
