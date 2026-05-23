import { CircleCheckBig, Clock3, FileText, Link2, ShieldCheck, Users } from 'lucide-react';

export interface AdminCardItem {
  id: string;
  label: string;
  value: number;
  trend: string;
}

export interface AdminShortcutItem {
  id: string;
  label: string;
  hint: string;
  path: string;
}

export interface AdminOverviewProps {
  title: string;
  subtitle: string;
  cards: AdminCardItem[];
  shortcuts: AdminShortcutItem[];
}

export const metricToneClassNames = [
  { icon: Users, tone: 'info' },
  { icon: ShieldCheck, tone: 'success' },
  { icon: FileText, tone: 'warning' },
  { icon: Link2, tone: 'danger' },
] as const;

export const shortcutToneClassNames = ['info', 'accent', 'success', 'warning'] as const;

export const readinessItems = [
  {
    id: 'access',
    label: 'Защита доступа включена',
    value: 'ОК',
    icon: CircleCheckBig,
    tone: 'success',
  },
  {
    id: 'api',
    label: 'API-контракт сгенерирован',
    value: 'ОК',
    icon: CircleCheckBig,
    tone: 'success',
  },
  {
    id: 'modules',
    label: 'Расширенные модули',
    value: 'Запланировано',
    icon: Clock3,
    tone: 'warning',
  },
] as const;

export const formatMetricValue = (value: number) => new Intl.NumberFormat('ru-RU').format(value);
