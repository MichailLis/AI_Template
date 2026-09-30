import { adminBadgeClassNames } from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';

const getLlmStatusBadgeConfig = (status: string | null | undefined) => {
  switch (status) {
    case 'ready':
      return { label: 'ИИ готов', className: adminBadgeClassNames.success };

    case 'pending':
      return { label: 'ИИ в обработке', className: adminBadgeClassNames.warning };

    case 'failed':
      return { label: 'ИИ ошибка', className: adminBadgeClassNames.danger };

    case 'not_requested':
      return { label: 'ИИ не запрашивался', className: adminBadgeClassNames.neutral };

    default:
      return null;
  }
};

export function LlmStatusBadge({ status }: { status: string | null | undefined }) {
  const config = getLlmStatusBadgeConfig(status);

  if (!config) {
    return null;
  }

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
