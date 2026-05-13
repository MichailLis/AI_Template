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
import { adminClassNames, adminToneClassNames } from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

import { parseAnalysisResult, prettyJson } from '../lib/test-analysis-result-parser';

import type {
  AnalysisPayload,
  AnalysisResult,
  AnalysisStatus,
} from '../lib/test-analysis-result-parser';
import type { ReactNode } from 'react';

interface TestAnalysisResultViewProps {
  analysis: AnalysisPayload | null;
  className?: string;
  showRawText?: boolean;
  showProviderBadge?: boolean;
  showErrorDetails?: boolean;
  showStructuredFallback?: boolean;
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
      <div className={`flex items-start gap-3 p-4 ${adminClassNames.panel.warningInline}`}>
        <Clock3 className="mt-0.5 h-4 w-4" />
        <div>
          <p className="font-medium">Анализ выполняется</p>
          <p className={`mt-1 ${adminToneClassNames.warning.text}`}>
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

function AnalysisStatusBadges({
  analysis,
  showProviderBadge,
  generatedAtLabel,
}: {
  analysis: AnalysisPayload | null;
  showProviderBadge: boolean;
  generatedAtLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={getStatusVariant(analysis?.status ?? 'PENDING')}>
        {statusLabels[analysis?.status ?? 'PENDING'] ?? analysis?.status ?? 'анализ'}
      </Badge>
      {showProviderBadge && analysis?.providerMode ? (
        <Badge variant="outline">{analysis.providerMode}</Badge>
      ) : null}
      {generatedAtLabel ? <Badge variant="outline">{generatedAtLabel}</Badge> : null}
    </div>
  );
}

function SkillsLevelSection({ skillsLevel }: { skillsLevel: AnalysisResult['skillsLevel'] }) {
  return (
    <SectionCard icon={BrainCircuit} title={skillsLevel.title}>
      <p className="text-sm leading-relaxed text-muted-foreground">{skillsLevel.summary}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {skillsLevel.items.map((item, index) => {
          const score = typeof item.score === 'number' ? item.score : null;

          return (
            <div
              key={`${item.name}-${item.level}-${index}`}
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
  );
}

function ThinkingTypeSection({ thinkingType }: { thinkingType: AnalysisResult['thinkingType'] }) {
  return (
    <SectionCard icon={Lightbulb} title={thinkingType.title}>
      <div className={`p-4 ${adminClassNames.panel.infoInline}`}>
        <p className={`text-sm font-semibold ${adminToneClassNames.info.text}`}>
          {thinkingType.type}
        </p>
        <p className={`mt-2 text-sm leading-relaxed ${adminToneClassNames.info.text}`}>
          {thinkingType.description}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {thinkingType.strengths.map((strength, index) => (
          <Badge key={`${strength}-${index}`} variant="outline">
            {strength}
          </Badge>
        ))}
      </div>
    </SectionCard>
  );
}

function PersonalityTraitsSection({
  personalityTraits,
}: {
  personalityTraits: AnalysisResult['personalityTraits'];
}) {
  return (
    <SectionCard icon={UserRound} title={personalityTraits.title}>
      <div className="grid gap-3">
        {personalityTraits.traits.map((trait, index) => (
          <div key={`${trait.name}-${index}`} className="rounded-lg border border-border/60 p-3">
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
  );
}

function CareerDevelopmentSection({
  careerDevelopment,
}: {
  careerDevelopment: AnalysisResult['careerDevelopment'];
}) {
  return (
    <SectionCard icon={BriefcaseBusiness} title="Карьера и профессиональное развитие">
      <p className="text-sm leading-relaxed text-muted-foreground">{careerDevelopment.summary}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <RecommendationColumn title="Направления" items={careerDevelopment.recommendedDirections} />
        <RecommendationColumn
          title="Развитие"
          items={careerDevelopment.developmentRecommendations}
        />
        <RecommendationColumn
          title="Следующие шаги"
          items={careerDevelopment.professionalNextSteps}
        />
      </div>
    </SectionCard>
  );
}

function ReadyAnalysisSections({ parsed }: { parsed: AnalysisResult }) {
  return (
    <div className="grid gap-4">
      <SkillsLevelSection skillsLevel={parsed.skillsLevel} />
      <ThinkingTypeSection thinkingType={parsed.thinkingType} />
      <PersonalityTraitsSection personalityTraits={parsed.personalityTraits} />
      <CareerDevelopmentSection careerDevelopment={parsed.careerDevelopment} />
    </div>
  );
}

export function TestAnalysisResultView({
  analysis,
  className,
  showRawText = true,
  showProviderBadge = true,
  showErrorDetails = true,
  showStructuredFallback = true,
  generatedAtLabel,
}: TestAnalysisResultViewProps) {
  const parsed = parseAnalysisResult(analysis?.summary ?? null);

  return (
    <div className={cn('space-y-4', className)}>
      <AnalysisStatusBadges
        analysis={analysis}
        showProviderBadge={showProviderBadge}
        generatedAtLabel={generatedAtLabel}
      />

      <StatusMessage analysis={analysis} />

      {analysis?.status === 'READY' && parsed ? <ReadyAnalysisSections parsed={parsed} /> : null}

      {analysis?.status === 'READY' && !parsed && showStructuredFallback ? (
        <SectionCard icon={Sparkles} title="Структурированные данные анализа">
          <pre className="max-h-96 overflow-auto rounded-md bg-muted/45 p-3 text-xs text-foreground">
            {prettyJson(analysis.summary)}
          </pre>
        </SectionCard>
      ) : null}

      {analysis?.status === 'READY' && !parsed && !showStructuredFallback ? (
        <div className="rounded-lg border border-border/60 bg-muted/35 p-4 text-sm text-muted-foreground">
          Итог прохождения сохранен. Подробный анализ для этого теста пока не настроен.
        </div>
      ) : null}

      {showRawText && analysis?.rawText ? (
        <SectionCard icon={CheckCircle2} title="Текст анализа">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {analysis.rawText}
          </p>
        </SectionCard>
      ) : null}

      {showErrorDetails && analysis?.errorMessage ? (
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
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
