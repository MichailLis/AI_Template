import { FileCode2, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

import { PublicTestAnalysisActionPlanCard } from './public-test-analysis-action-plan-card';
import { PublicTestAnalysisArchetypeCard } from './public-test-analysis-archetype-card';
import { PublicTestAnalysisProfessionCard } from './public-test-analysis-profession-card';
import { PublicTestAnalysisReportHeader } from './public-test-analysis-report-header';
import { PublicTestAnalysisTraitsCard } from './public-test-analysis-traits-card';

import type { PublicTestAnalysisReportViewModel } from './public-test-analysis.types';

interface PublicTestAnalysisReportLayoutProps {
  report: PublicTestAnalysisReportViewModel;
  entryHref: string | null;
  errorMessage: string | null;
}

export function PublicTestAnalysisReportLayout({
  report,
  entryHref,
  errorMessage,
}: PublicTestAnalysisReportLayoutProps) {
  const topProfession = report.professions[0] ?? null;
  const secondaryProfessions = report.professions.slice(1, 3);
  const extraProfessions = report.professions.slice(3);

  return (
    <div className="space-y-4">
      <PublicTestAnalysisReportHeader />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2 h-full">
          <PublicTestAnalysisArchetypeCard
            title={report.archetypeTitle}
            description={report.archetypeDescription}
          />
        </div>
        <div className="md:col-span-1 md:row-span-2 h-full">
          <PublicTestAnalysisTraitsCard traits={report.traitScores} />
        </div>

        {topProfession ? (
          <div className="md:col-span-2 h-full">
            <PublicTestAnalysisProfessionCard profession={topProfession} featured />
          </div>
        ) : null}

        {secondaryProfessions.map((profession) => (
          <div key={profession.rank} className="h-full">
            <PublicTestAnalysisProfessionCard profession={profession} />
          </div>
        ))}

        <div className="h-full">
          <PublicTestAnalysisActionPlanCard steps={report.actionPlan} />
        </div>
      </div>

      {extraProfessions.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {extraProfessions.map((profession) => (
            <div key={profession.rank} className="h-full">
              <PublicTestAnalysisProfessionCard profession={profession} />
            </div>
          ))}
        </div>
      ) : null}

      {report.narrative ? (
        <Card className="border-border/60 bg-card/90 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed text-foreground">{report.narrative}</p>
          </CardContent>
        </Card>
      ) : null}

      {report.note ? (
        <Card className="border-border/60 bg-card/90 shadow-sm">
          <CardContent className="inline-flex items-start gap-2 p-4 text-sm text-muted-foreground">
            <FileCode2 className="mt-0.5 h-4 w-4 text-primary" />
            <span>{report.note}</span>
          </CardContent>
        </Card>
      ) : null}

      {errorMessage ? (
        <Card className="border-destructive/45 bg-destructive/10 shadow-sm">
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      {entryHref ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center print:hidden">
          <p className="text-sm text-muted-foreground">
            Хотите получить другой результат? Можно пройти тест еще раз.
          </p>
          <Button asChild variant="outline" className="rounded-xl border-border/60 bg-transparent">
            <Link to={entryHref}>
              <RotateCcw className="h-4 w-4" />
              Пройти тест заново
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
