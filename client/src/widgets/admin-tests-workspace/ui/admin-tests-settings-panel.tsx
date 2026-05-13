import { adminClassNames } from '@/shared/ui/admin-design-tokens';

import type { ReactNode } from 'react';

interface AdminTestsSettingsPanelProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function AdminTestsSettingsPanel({
  title,
  description,
  children,
}: AdminTestsSettingsPanelProps) {
  return (
    <div className={adminClassNames.panel.compactSection}>
      <p className={`text-sm font-medium ${adminClassNames.text.heading}`}>{title}</p>
      {description ? (
        <p className={`mt-1 text-sm ${adminClassNames.text.body}`}>{description}</p>
      ) : null}
      {children}
    </div>
  );
}
