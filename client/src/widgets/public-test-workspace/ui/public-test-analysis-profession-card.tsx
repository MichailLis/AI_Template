import { BriefcaseBusiness, TrendingUp } from 'lucide-react';

import { Card, CardContent } from '@/shared/ui/card';

import type { AnalysisProfessionRecommendation } from './public-test-analysis.types';

interface PublicTestAnalysisProfessionCardProps {
  profession: AnalysisProfessionRecommendation;
  featured?: boolean;
}

export function PublicTestAnalysisProfessionCard({
  profession,
  featured = false,
}: PublicTestAnalysisProfessionCardProps) {
  return (
    <Card
      className={`h-full border-border/60 bg-card/90 shadow-sm ${featured ? 'ring-1 ring-primary/35' : ''}`}
    >
      <CardContent className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex min-h-6 items-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
              #{profession.rank}
            </p>
            <h4 className="text-base font-semibold text-foreground">{profession.title}</h4>
          </div>
          <span className="rounded-full bg-primary/12 px-2 py-1 text-xs font-semibold text-primary">
            {profession.matchScore}%
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-muted/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
            style={{ width: `${profession.matchScore}%` }}
          />
        </div>

        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
          {profession.description}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <BriefcaseBusiness className="h-3.5 w-3.5 text-primary" />
            {profession.salary}
          </span>
          <span className="inline-flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            {profession.growth}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
