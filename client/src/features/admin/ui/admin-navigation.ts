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

export const navToneClassNames = {
  overview: {
    active: 'border-sky-200 bg-sky-50 text-sky-950 shadow-sm',
    icon: 'bg-sky-100 text-sky-700',
  },
  content: {
    active: 'border-indigo-200 bg-indigo-50 text-indigo-950 shadow-sm',
    icon: 'bg-indigo-100 text-indigo-700',
  },
  publication: {
    active: 'border-emerald-200 bg-emerald-50 text-emerald-950 shadow-sm',
    icon: 'bg-emerald-100 text-emerald-700',
  },
  analytics: {
    active: 'border-amber-200 bg-amber-50 text-amber-950 shadow-sm',
    icon: 'bg-amber-100 text-amber-700',
  },
  system: {
    active: 'border-slate-200 bg-slate-100 text-slate-950 shadow-sm',
    icon: 'bg-slate-200 text-slate-700',
  },
} as const;

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
