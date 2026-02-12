import { AlertTriangle, ShieldCheck } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

interface AdminCardItem {
  id: string;
  label: string;
  value: number;
  trend: string;
}

interface AdminShortcutItem {
  id: string;
  label: string;
  hint: string;
  path: string;
}

interface AdminOverviewProps {
  title: string;
  subtitle: string;
  cards: AdminCardItem[];
  shortcuts: AdminShortcutItem[];
}

export const AdminOverview = ({ title, subtitle, cards, shortcuts }: AdminOverviewProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="mt-1">{subtitle}</CardDescription>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Protected zone
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl">{item.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">{item.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Placeholder actions for further admin modules.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {shortcuts.map((item) => (
            <div key={item.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="font-medium text-slate-900">{item.label}</p>
              <p className="mt-1 text-sm text-slate-500">{item.hint}</p>
              <Button variant="outline" size="sm" className="mt-3" disabled>
                {item.path}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-center gap-3 p-4 text-amber-800">
          <AlertTriangle className="h-5 w-5" />
          This is a baseline admin scaffold. Extend it through template pipeline steps.
        </CardContent>
      </Card>
    </div>
  );
};
