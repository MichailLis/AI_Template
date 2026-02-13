import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

const checks = [
  {
    id: 'sec-01',
    title: 'Политика MFA',
    status: 'Включено',
    description: 'Для всех админ-аккаунтов требуется MFA при входе.',
  },
  {
    id: 'sec-02',
    title: 'Ротация сессий',
    status: 'Включено',
    description: 'Ротация refresh-токенов и отзыв при выходе активны.',
  },
  {
    id: 'sec-03',
    title: 'Поток аудита',
    status: 'Запланировано',
    description: 'Экспорт операционного аудита запланирован на следующую итерацию.',
  },
];

export default function AdminSecurityPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Контроль безопасности</CardTitle>
          <CardDescription>Статус базовых мер защиты админ-панели.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {checks.map((item) => (
            <div key={item.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-900">{item.title}</p>
                <Badge variant={item.status === 'Включено' ? 'secondary' : 'outline'}>
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
          <CardTitle>Действия по политикам</CardTitle>
          <CardDescription>Зарезервированные действия для управления политиками.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" disabled>
            Ротировать все сессии
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            Экспорт журнала аудита
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            Открыть отчет по безопасности
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
