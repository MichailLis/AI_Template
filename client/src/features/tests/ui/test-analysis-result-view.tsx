import {
  AlertTriangle,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Lightbulb,
  Sparkles,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

import { parseAnalysisResult, prettyJson } from '../lib/test-analysis-result-parser';

import type { AnalysisPayload, AnalysisStatus } from '../lib/test-analysis-result-parser';
import type { ReactNode } from 'react';

interface TestAnalysisResultViewProps {
  analysis: AnalysisPayload | null;
  className?: string;
  showRawText?: boolean;
  generatedAtLabel?: string;
}

const levelLabels = {
  low: 'начальный',
  medium: 'средний',
  high: 'сильный',
} as const;

const statusLabels: Record<string, string> = {
  READY: 'анализ готов',
  PENDING: 'анализ выполняется',
  FAILED: 'ошибка анализа',
};

const getStatusVariant = (status: AnalysisStatus): 'outline' | 'secondary' | 'destructive' => {
  if (status === 'READY') {
    return 'secondary';
  }

  if (status === 'FAILED') {
    return 'destructive';
  }

  return 'outline';
};

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function StatusMessage({ analysis }: { analysis: AnalysisPayload | null }) {
  if (!analysis) {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/35 p-4 text-sm text-muted-foreground">
        Анализ пока не создан.
      </div>
    );
  }

  if (analysis.status === 'PENDING') {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <Clock3 className="mt-0.5 h-4 w-4" />
        <div>
          <p className="font-medium">Анализ выполняется</p>
          <p className="mt-1 text-amber-800">
            Мы обрабатываем ответы. Страница обновится автоматически через несколько секунд.
          </p>
        </div>
      </div>
    );
  }

  if (analysis.status === 'FAILED') {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        <AlertTriangle className="mt-0.5 h-4 w-4" />
        <div>
          <p className="font-medium">Не удалось сформировать анализ</p>
          <p className="mt-1">
            Попробуйте обновить страницу позже или обратитесь к администратору.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export function TestAnalysisResultView({
  analysis,
  className,
  showRawText = true,
  generatedAtLabel,
}: TestAnalysisResultViewProps) {
  const parsed = parseAnalysisResult(analysis?.summary ?? null);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={getStatusVariant(analysis?.status ?? 'PENDING')}>
          {statusLabels[analysis?.status ?? 'PENDING'] ?? analysis?.status ?? 'анализ'}
        </Badge>
        {analysis?.providerMode ? <Badge variant="outline">{analysis.providerMode}</Badge> : null}
        {generatedAtLabel ? <Badge variant="outline">{generatedAtLabel}</Badge> : null}
      </div>

      <StatusMessage analysis={analysis} />

      {analysis?.status === 'READY' && parsed ? (
        <div className="grid gap-4">
          <SectionCard icon={BrainCircuit} title={parsed.skillsLevel.title}>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {parsed.skillsLevel.summary}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {parsed.skillsLevel.items.map((item) => {
                const score = typeof item.score === 'number' ? item.score : null;

                return (
                  <div
                    key={`${item.name}-${item.level}`}
                    className="rounded-lg border border-border/60 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <Badge variant="outline">{levelLabels[item.level]}</Badge>
                    </div>
                    {score !== null ? (
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                        />
                      </div>
                    ) : null}
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard icon={Lightbulb} title={parsed.thinkingType.title}>
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
              <p className="text-sm font-semibold text-sky-950">{parsed.thinkingType.type}</p>
              <p className="mt-2 text-sm leading-relaxed text-sky-900">
                {parsed.thinkingType.description}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {parsed.thinkingType.strengths.map((strength) => (
                <Badge key={strength} variant="outline">
                  {strength}
                </Badge>
              ))}
            </div>
          </SectionCard>

          <SectionCard icon={UserRound} title={parsed.personalityTraits.title}>
            <div className="grid gap-3">
              {parsed.personalityTraits.traits.map((trait) => (
                <div key={trait.name} className="rounded-lg border border-border/60 p-3">
                  <p className="text-sm font-semibold text-foreground">{trait.name}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {trait.description}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    <span className="font-medium">В карьере: </span>
                    {trait.careerImpact}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard icon={BriefcaseBusiness} title="Карьера и профессиональное развитие">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {parsed.careerDevelopment.summary}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <RecommendationColumn
                title="Направления"
                items={parsed.careerDevelopment.recommendedDirections}
              />
              <RecommendationColumn
                title="Развитие"
                items={parsed.careerDevelopment.developmentRecommendations}
              />
              <RecommendationColumn
                title="Следующие шаги"
                items={parsed.careerDevelopment.professionalNextSteps}
              />
            </div>
          </SectionCard>
        </div>
      ) : null}

      {analysis?.status === 'READY' && !parsed ? (
        <SectionCard icon={Sparkles} title="Структурированные данные анализа">
          <pre className="max-h-96 overflow-auto rounded-md bg-muted/45 p-3 text-xs text-foreground">
            {prettyJson(analysis.summary)}
          </pre>
        </SectionCard>
      ) : null}

      {showRawText && analysis?.rawText ? (
        <SectionCard icon={CheckCircle2} title="Текст анализа">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {analysis.rawText}
          </p>
        </SectionCard>
      ) : null}

      {analysis?.errorMessage ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {analysis.errorMessage}
        </div>
      ) : null}
    </div>
  );
}

function RecommendationColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <ul className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
