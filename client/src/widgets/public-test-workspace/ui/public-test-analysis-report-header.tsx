import { CheckCircle2, Download } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export function PublicTestAnalysisReportHeader() {
  const handleDownloadPdf = () => {
    window.print();
  };

  return (
    <Card className="border-border/60 bg-card/90 shadow-sm">
      <CardHeader className="space-y-2 md:space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-primary/85">Анализ завершен</p>
            <CardTitle className="text-3xl md:text-4xl">Ваш карьерный отчет</CardTitle>
            <CardDescription>
              Персональный разбор сильных сторон, карьерных направлений и рекомендованных шагов.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto print:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              className="rounded-xl border-border/60 bg-transparent"
            >
              <Download className="h-4 w-4" />
              Скачать PDF
            </Button>
            <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-3 text-primary-foreground">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-px w-full bg-border/60" />
      </CardContent>
    </Card>
  );
}
