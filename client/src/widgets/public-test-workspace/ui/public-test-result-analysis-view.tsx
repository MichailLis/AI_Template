import {
  AlertTriangle,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Lightbulb,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

import { parseAnalysisResult } from '@/features/tests';
import { Badge } from '@/shared/ui/badge';

import type { AnalysisPayload, AnalysisResult } from '@/features/tests';
import type { ReactNode } from 'react';

const levelLabels = {
  low: 'начальный',
  medium: 'средний',
  high: 'сильный',
} as const;

const renderStatusPanelIcon = (tone: 'pending' | 'danger' | 'muted') => {
  const className = 'mt-0.5 h-4 w-4 shrink-0';

  if (tone === 'danger') {
    return <AlertTriangle className={className} aria-hidden="true" />;
  }

  if (tone === 'pending') {
    return <Clock3 className={className} aria-hidden="true" />;
  }

  return <CheckCircle2 className={className} aria-hidden="true" />;
};

const getStatusPanelToneClassName = (tone: 'pending' | 'danger' | 'muted') => {
  if (tone === 'danger') {
    return 'border-destructive/35 bg-destructive/10 text-destructive';
  }

  if (tone === 'pending') {
    return 'border-amber-200 bg-amber-50 text-amber-900';
  }

  return 'border-border/60 bg-card/45 text-muted-foreground';
};

function PublicResultStatusPanel({
  tone,
  title,
  children,
}: {
  tone: 'pending' | 'danger' | 'muted';
  title: string;
  children: ReactNode;
}) {
  const toneClassName = getStatusPanelToneClassName(tone);

  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${toneClassName}`}>
      {renderStatusPanelIcon(tone)}
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function ResultSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="public-result-section border-t border-border/55 pt-7 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-start gap-3">
        <span className="public-result-section-icon mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <h2 className="text-balance text-xl font-bold leading-tight text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SkillTile({ item }: { item: AnalysisResult['skillsLevel']['items'][number] }) {
  const score = typeof item.score === 'number' ? Math.max(0, Math.min(100, item.score)) : null;

  return (
    <article className="public-glass-soft public-skill-tile rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold leading-snug text-foreground">{item.name}</h3>
        <Badge variant="outline" className="public-level-badge shrink-0 bg-card/60">
          {levelLabels[item.level]}
        </Badge>
      </div>
      {score !== null ? (
        <div className="public-skill-track mt-3 h-2 overflow-hidden rounded-full">
          <div
            className="public-skill-fill h-full rounded-full"
            style={{ width: `${score}%` }}
            aria-hidden="true"
          />
        </div>
      ) : null}
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
    </article>
  );
}

function SkillsSection({ skillsLevel }: { skillsLevel: AnalysisResult['skillsLevel'] }) {
  return (
    <ResultSection icon={BrainCircuit} title={skillsLevel.title}>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {skillsLevel.summary}
      </p>
      <div className="public-skills-grid mt-4 grid gap-3 md:grid-cols-2">
        {skillsLevel.items.map((item, index) => (
          <SkillTile key={`${item.name}-${item.level}-${index}`} item={item} />
        ))}
      </div>
    </ResultSection>
  );
}

function ThinkingSection({ thinkingType }: { thinkingType: AnalysisResult['thinkingType'] }) {
  return (
    <ResultSection icon={Lightbulb} title={thinkingType.title}>
      <div className="public-thinking-panel rounded-2xl p-4">
        <h3 className="text-base font-semibold text-foreground">{thinkingType.type}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {thinkingType.description}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {thinkingType.strengths.map((strength, index) => (
          <Badge key={`${strength}-${index}`} variant="outline" className="bg-card/55">
            {strength}
          </Badge>
        ))}
      </div>
    </ResultSection>
  );
}

function TraitsSection({
  personalityTraits,
}: {
  personalityTraits: AnalysisResult['personalityTraits'];
}) {
  return (
    <ResultSection icon={UserRound} title={personalityTraits.title}>
      <div className="public-traits-grid grid gap-3 md:grid-cols-2">
        {personalityTraits.traits.map((trait, index) => (
          <article
            key={`${trait.name}-${index}`}
            className="public-glass-soft public-trait-card rounded-2xl p-4"
          >
            <h3 className="text-sm font-semibold text-foreground">{trait.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {trait.description}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-foreground">
              <span className="font-semibold">В карьере: </span>
              {trait.careerImpact}
            </p>
          </article>
        ))}
      </div>
    </ResultSection>
  );
}

function RecommendationGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="public-glass-soft public-route-card rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2">
            <span
              className="public-route-dot mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function CareerSection({
  careerDevelopment,
}: {
  careerDevelopment: AnalysisResult['careerDevelopment'];
}) {
  return (
    <ResultSection icon={BriefcaseBusiness} title="Карьера и профессиональное развитие">
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {careerDevelopment.summary}
      </p>
      <div className="public-career-grid mt-4 grid gap-3 lg:grid-cols-3">
        <RecommendationGroup title="Направления" items={careerDevelopment.recommendedDirections} />
        <RecommendationGroup
          title="Развитие"
          items={careerDevelopment.developmentRecommendations}
        />
        <RecommendationGroup
          title="Следующие шаги"
          items={careerDevelopment.professionalNextSteps}
        />
      </div>
    </ResultSection>
  );
}

export function PublicTestResultAnalysisView({ analysis }: { analysis: AnalysisPayload | null }) {
  const parsed = parseAnalysisResult(analysis?.summary ?? null);

  if (!analysis || analysis.status === 'PENDING') {
    return (
      <PublicResultStatusPanel tone="pending" title="Анализ выполняется">
        Мы обрабатываем ответы. Страница обновится автоматически через несколько секунд.
      </PublicResultStatusPanel>
    );
  }

  if (analysis.status === 'FAILED') {
    return (
      <PublicResultStatusPanel tone="danger" title="Не удалось сформировать анализ">
        Обновите страницу позже или обратитесь к администратору теста.
      </PublicResultStatusPanel>
    );
  }

  if (!parsed) {
    return (
      <PublicResultStatusPanel tone="muted" title="Итог прохождения сохранен">
        Подробный анализ для этого теста пока не настроен.
      </PublicResultStatusPanel>
    );
  }

  return (
    <div className="space-y-6">
      <SkillsSection skillsLevel={parsed.skillsLevel} />
      <ThinkingSection thinkingType={parsed.thinkingType} />
      <TraitsSection personalityTraits={parsed.personalityTraits} />
      <CareerSection careerDevelopment={parsed.careerDevelopment} />
    </div>
  );
}
