import { Button } from '@/shared/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';

import type { ReactNode } from 'react';

interface AdminListToolbarTab<T extends string> {
  value: T;
  label: string;
}

interface AdminListToolbarProps<T extends string> {
  title: string;
  description: string;
  searchId: string;
  searchValue: string;
  searchPlaceholder: string;
  activeTab: T;
  tabs: AdminListToolbarTab<T>[];
  actions?: ReactNode;
  onTabChange: (tab: T) => void;
  onSearchChange: (value: string) => void;
}

export function AdminListToolbar<T extends string>({
  title,
  description,
  searchId,
  searchValue,
  searchPlaceholder,
  activeTab,
  tabs,
  actions,
  onTabChange,
  onSearchChange,
}: AdminListToolbarProps<T>) {
  return (
    <CardHeader className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit flex-wrap rounded-lg border border-border bg-muted p-1">
          {tabs.map((tab) => (
            <Button
              key={tab.value}
              type="button"
              size="sm"
              variant={activeTab === tab.value ? 'secondary' : 'ghost'}
              className={
                activeTab === tab.value
                  ? 'bg-background shadow-sm hover:bg-background'
                  : 'text-muted-foreground hover:text-foreground'
              }
              onClick={() => onTabChange(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="w-full max-w-md">
          <Input
            id={searchId}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="bg-background"
          />
        </div>
      </div>
    </CardHeader>
  );
}
