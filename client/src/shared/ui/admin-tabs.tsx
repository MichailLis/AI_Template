import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';

import type { KeyboardEvent } from 'react';

interface AdminTabItem<TValue extends string> {
  value: TValue;
  label: string;
}

interface AdminTabsProps<TValue extends string> {
  ariaLabel: string;
  tabs: AdminTabItem<TValue>[];
  activeTab: TValue;
  onTabChange: (tab: TValue) => void;
  /**
   * Идентификатор области, которой управляют вкладки. Передается там, где панель действительно
   * существует в разметке: без него `aria-controls` указывал бы в пустоту.
   */
  panelId?: string;
}

const getTabId = (panelId: string | undefined, value: string) =>
  panelId ? `${panelId}-tab-${value}` : undefined;

export function AdminTabs<TValue extends string>({
  ariaLabel,
  tabs,
  activeTab,
  onTabChange,
  panelId,
}: AdminTabsProps<TValue>) {
  /**
   * Роль `tablist` обещает перемещение стрелками — без него скринридер объявляет вкладки, но
   * пользователь не может их обойти клавиатурой, потому что фокус получает только активная.
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
      return;
    }

    event.preventDefault();

    const offset = event.key === 'ArrowRight' ? 1 : -1;
    const currentIndex = tabs.findIndex((tab) => tab.value === activeTab);
    const nextTab = tabs[(currentIndex + offset + tabs.length) % tabs.length];

    onTabChange(nextTab.value);
    event.currentTarget.parentElement
      ?.querySelector<HTMLButtonElement>(`[data-tab-value="${nextTab.value}"]`)
      ?.focus();
  };

  return (
    <div role="tablist" aria-label={ariaLabel} className={adminClassNames.toolbar.tabs}>
      {tabs.map((tab) => {
        const isActive = tab.value === activeTab;

        return (
          <Button
            key={tab.value}
            type="button"
            role="tab"
            id={getTabId(panelId, tab.value)}
            data-tab-value={tab.value}
            aria-selected={isActive}
            aria-controls={panelId}
            tabIndex={isActive ? 0 : -1}
            size="sm"
            variant={isActive ? 'secondary' : 'ghost'}
            className={
              isActive ? adminClassNames.toolbar.activeTab : adminClassNames.toolbar.inactiveTab
            }
            onClick={() => onTabChange(tab.value)}
            onKeyDown={handleKeyDown}
          >
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
}
