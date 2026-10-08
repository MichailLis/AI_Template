import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';

import { useThemeStore, type ThemePreference } from '@/shared/lib/theme';
import { cn } from '@/shared/lib/utils';
import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';

const options: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Светлая тема', icon: Sun },
  { value: 'system', label: 'Как в системе', icon: Monitor },
  { value: 'dark', label: 'Тёмная тема', icon: Moon },
];

export const AdminThemeToggle = () => {
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);

  return (
    <div role="group" aria-label="Тема оформления" className={adminClassNames.header.themeToggle}>
      {options.map(({ value, label, icon: Icon }) => {
        const isActive = preference === value;

        return (
          <Button
            key={value}
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'size-7',
              isActive ? adminClassNames.toolbar.activeTab : adminClassNames.toolbar.inactiveTab,
            )}
            aria-label={label}
            title={label}
            aria-pressed={isActive}
            onClick={() => setPreference(value)}
          >
            <Icon />
          </Button>
        );
      })}
    </div>
  );
};
