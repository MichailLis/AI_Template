import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminTabs } from '@/shared/ui/admin-tabs';
import { Input } from '@/shared/ui/input';

import type { ReactNode } from 'react';

interface AdminListToolbarTab<T extends string> {
  value: T;
  label: string;
}

interface AdminListToolbarProps<T extends string> {
  /**
   * Название раздела уже стоит в шапке админки, поэтому список его не повторяет: заголовок здесь
   * нужен только там, где карточка — не единственный блок экрана.
   */
  tabsLabel: string;
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
  tabsLabel,
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
    <div className="flex flex-col gap-3 border-b border-admin-border p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <AdminTabs
        ariaLabel={tabsLabel}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      {/* flex-wrap: рядом с боковым меню на 768–896 px строка не помещалась и кнопка «Создать» вылезала за карточку. */}
      <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:max-w-full sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <Input
          id={searchId}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className={`w-full sm:w-72 ${adminClassNames.toolbar.input}`}
        />

        {/* На узком экране кнопки идут снизу вверх: основное действие в списках стоит последним в
            разметке, и без разворота оно оказывалось третьей кнопкой в столбце. */}
        {actions ? (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
