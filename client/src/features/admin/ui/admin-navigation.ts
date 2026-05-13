import {
  BarChart3,
  Building2,
  ClipboardList,
  LayoutDashboard,
  Link2,
  MessageSquareText,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { adminToneClassNames, type AdminTone } from '@/shared/ui/admin-design-tokens';

type AdminNavGroupId = 'overview' | 'content' | 'publication' | 'analytics' | 'system';

export interface AdminNavItem {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
  group: AdminNavGroupId;
}

export const navItems: AdminNavItem[] = [
  {
    id: 'overview',
    label: 'Обзор',
    description: 'Сводка и быстрые действия',
    icon: LayoutDashboard,
    href: '/admin',
    group: 'overview',
  },
  {
    id: 'users',
    label: 'Пользователи',
    description: 'Роли и доступы',
    icon: Users,
    href: '/admin/users',
    group: 'content',
  },
  {
    id: 'prompts',
    label: 'Промпты',
    description: 'Prompt Studio',
    icon: MessageSquareText,
    href: '/admin/prompts',
    group: 'content',
  },
  {
    id: 'tests',
    label: 'Тесты',
    description: 'Темы, вопросы, публикации',
    icon: ClipboardList,
    href: '/admin/tests',
    group: 'content',
  },
  {
    id: 'public-links',
    label: 'Публичные ссылки',
    description: 'Доступ для студентов',
    icon: Link2,
    href: '/admin/public-links',
    group: 'publication',
  },
  {
    id: 'education-organizations',
    label: 'Учебные заведения',
    description: 'Организации и группы',
    icon: Building2,
    href: '/admin/public-links/organizations',
    group: 'publication',
  },
  {
    id: 'analytics',
    label: 'Аналитика',
    description: 'Отчеты и срезы',
    icon: BarChart3,
    href: '/admin/analytics',
    group: 'analytics',
  },
  {
    id: 'public-links-stats',
    label: 'Статистика ссылок',
    description: 'Попытки и результаты',
    icon: BarChart3,
    href: '/admin/public-links/stats',
    group: 'analytics',
  },
  {
    id: 'settings',
    label: 'Настройки',
    description: 'Ключи и интеграции',
    icon: Settings,
    href: '/admin/settings',
    group: 'system',
  },
];

export const navGroups: Array<{ id: AdminNavGroupId; label: string }> = [
  {
    id: 'overview',
    label: 'Обзор',
  },
  {
    id: 'content',
    label: 'Контент',
  },
  {
    id: 'publication',
    label: 'Публикация',
  },
  {
    id: 'analytics',
    label: 'Аналитика',
  },
  {
    id: 'system',
    label: 'Система',
  },
];

const navGroupTones = {
  overview: 'info',
  content: 'accent',
  publication: 'success',
  analytics: 'warning',
  system: 'neutral',
} satisfies Record<AdminNavGroupId, AdminTone>;

export const navToneClassNames = Object.fromEntries(
  Object.entries(navGroupTones).map(([group, tone]) => [
    group,
    {
      active: adminToneClassNames[tone].active,
      icon: adminToneClassNames[tone].icon,
    },
  ]),
) as Record<AdminNavGroupId, { active: string; icon: string }>;

export const resolveActiveNavHref = (currentPath: string) => {
  if (currentPath === '/admin') {
    return '/admin';
  }

  const matchedHrefs = navItems
    .map((item) => item.href)
    .filter((href) => currentPath === href || currentPath.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length);

  return matchedHrefs[0] ?? '';
};

export const normalizeSearchValue = (value: string) => value.trim().toLowerCase();

export const findNavItem = (value: string) => {
  const normalizedValue = normalizeSearchValue(value);

  if (!normalizedValue) {
    return undefined;
  }

  return navItems.find((item) => {
    const searchable = `${item.label} ${item.description} ${item.href}`.toLowerCase();
    return searchable.includes(normalizedValue);
  });
};
