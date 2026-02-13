import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

const events = [
  { id: 'EVT-9214', area: 'Auth', actor: 'ops-admin@company.dev', impact: 'Medium', time: '09:15' },
  {
    id: 'EVT-9213',
    area: 'Users',
    actor: 'security.lead@company.dev',
    impact: 'Low',
    time: '09:02',
  },
  { id: 'EVT-9208', area: 'Config', actor: 'ops-admin@company.dev', impact: 'High', time: '08:31' },
  {
    id: 'EVT-9204',
    area: 'Access',
    actor: 'finance.viewer@company.dev',
    impact: 'Low',
    time: '08:04',
  },
];

const impactVariant = (impact: string) => {
  if (impact === 'High') {
    return 'destructive' as const;
  }

  if (impact === 'Medium') {
    return 'outline' as const;
  }

  return 'secondary' as const;
};

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Events today</CardDescription>
            <CardTitle className="text-3xl">124</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Operational events captured in this workspace.</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>High impact</CardDescription>
            <CardTitle className="text-3xl">8</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Actions requiring review and approval workflow.
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Mean response</CardDescription>
            <CardTitle className="text-3xl">11m</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Target SLA: under 15 minutes for admin events.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Recent admin events</CardTitle>
          <CardDescription>Event stream table scaffold for operational analytics.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium text-slate-900">{event.id}</TableCell>
                  <TableCell>{event.area}</TableCell>
                  <TableCell className="text-slate-600">{event.actor}</TableCell>
                  <TableCell>
                    <Badge variant={impactVariant(event.impact)}>{event.impact}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-slate-500">{event.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
