import { Target } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

import type { AnalysisActionPlanStep } from './public-test-analysis.types';

interface PublicTestAnalysisActionPlanCardProps {
  steps: AnalysisActionPlanStep[];
}

export function PublicTestAnalysisActionPlanCard({ steps }: PublicTestAnalysisActionPlanCardProps) {
  return (
    <Card className="h-full border-border/60 bg-card/90 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="inline-flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-primary" />
          Рекомендованный план действий
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li key={step.id} className="rounded-lg border border-border/50 bg-background/60 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{`${index + 1}. ${step.title}`}</p>
                <span className="text-xs text-primary">{step.timeframe}</span>
              </div>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
