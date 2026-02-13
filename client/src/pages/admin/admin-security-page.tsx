import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

const checks = [
  {
    id: 'sec-01',
    title: 'MFA policy',
    status: 'Enabled',
    description: 'All admin accounts require MFA verification at login.',
  },
  {
    id: 'sec-02',
    title: 'Session rotation',
    status: 'Enabled',
    description: 'Refresh token rotation and revoke-on-logout are active.',
  },
  {
    id: 'sec-03',
    title: 'Audit stream',
    status: 'Planned',
    description: 'Operational audit export is scheduled for the next iteration.',
  },
];

export default function AdminSecurityPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Security controls</CardTitle>
          <CardDescription>Control-plane status for baseline admin hardening.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {checks.map((item) => (
            <div key={item.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-900">{item.title}</p>
                <Badge variant={item.status === 'Enabled' ? 'secondary' : 'outline'}>
                  {item.status}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Policy actions</CardTitle>
          <CardDescription>Reserved actions for policy management.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" disabled>
            Rotate all sessions
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            Export audit trail
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            Open security report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
