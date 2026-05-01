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
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      {children}
    </div>
  );
}
