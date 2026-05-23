import {
  AlertTriangle,
  BrainCircuit,
  BriefcaseBusiness,
  Clock3,
  Lightbulb,
  Sparkles,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

import {
  adminBadgeClassNames,
  adminClassNames,
  adminToneClassNames,
} from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

import { levelLabels, statusLabels } from './test-analysis-result-view.model';

import type {
  AnalysisPayload,
  AnalysisResult,
  AnalysisStatus,
} from '../lib/test-analysis-result-parser';
import type { ReactNode } from 'react';

const getStatusBadgeClassName = (status: AnalysisStatus) => {
  if (status === 'READY') {
    return adminBadgeClassNames.success;
  }

  if (status === 'FAILED') {
    return adminBadgeClassNames.danger;
  }

  return adminBadgeClassNames.warning;
};

export function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className={adminClassNames.panel.card}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`size-4 ${adminToneClassNames.accent.textAccent}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function StatusMessage({ analysis }: { analysis: AnalysisPayload | null }) {
  if (!analysis) {
    return <div className={adminClassNames.panel.empty}>Анализ пока не создан.</div>;
  }

  if (analysis.status === 'PENDING') {
    return (
      <div className={`flex items-start gap-3 p-4 ${adminClassNames.panel.warningInline}`}>
        <Clock3 className="mt-0.5 size-4" />
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
      <div className={`flex items-start gap-3 p-4 ${adminClassNames.panel.dangerInline}`}>
        <AlertTriangle className="mt-0.5 size-4" />
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

export function AnalysisStatusBadges({
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
      <Badge variant="outline" className={getStatusBadgeClassName(analysis?.status ?? 'PENDING')}>
        {statusLabels[analysis?.status ?? 'PENDING'] ?? analysis?.status ?? 'анализ'}
      </Badge>
      {showProviderBadge && analysis?.providerMode ? (
        <Badge variant="outline">{analysis.providerMode}</Badge>
      ) : null}
      {generatedAtLabel ? <Badge variant="outline">{generatedAtLabel}</Badge> : null}
    </div>
  );
}

function IntroductionSection({ introduction }: { introduction: string }) {
  return (
    <SectionCard icon={Sparkles} title="Введение">
      <p className={`text-sm leading-relaxed ${adminClassNames.text.body}`}>{introduction}</p>
    </SectionCard>
  );
}

function SkillsLevelSection({ skillsLevel }: { skillsLevel: AnalysisResult['skillsLevel'] }) {
  return (
    <SectionCard icon={BrainCircuit} title={skillsLevel.title}>
      <p className={`text-sm leading-relaxed ${adminClassNames.text.body}`}>
        {skillsLevel.summary}
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {skillsLevel.items.map((item, index) => {
          const score = typeof item.score === 'number' ? item.score : null;

          return (
            <div
              key={`${item.name}-${item.level}-${index}`}
              className={adminClassNames.panel.compactCard}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={`text-sm font-semibold ${adminClassNames.text.heading}`}>
                  {item.name}
                </p>
                <Badge variant="outline">{levelLabels[item.level]}</Badge>
              </div>
              {score !== null ? (
                <div
                  className={`mt-3 h-2 overflow-hidden rounded-full ${adminClassNames.panel.mutedBar}`}
                >
                  <div
                    className={`h-full rounded-full ${adminClassNames.switch.active}`}
                    style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                  />
                </div>
              ) : null}
              <p className={`mt-3 text-sm leading-relaxed ${adminClassNames.text.body}`}>
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
          <div key={`${trait.name}-${index}`} className={adminClassNames.panel.compactCard}>
            <p className={`text-sm font-semibold ${adminClassNames.text.heading}`}>{trait.name}</p>
            <p className={`mt-2 text-sm leading-relaxed ${adminClassNames.text.body}`}>
              {trait.description}
            </p>
            <p className={`mt-2 text-sm leading-relaxed ${adminClassNames.text.heading}`}>
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
      <p className={`text-sm leading-relaxed ${adminClassNames.text.body}`}>
        {careerDevelopment.summary}
      </p>
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

export function ReadyAnalysisSections({ parsed }: { parsed: AnalysisResult }) {
  return (
    <div className="grid gap-4">
      <IntroductionSection introduction={parsed.introduction} />
      <SkillsLevelSection skillsLevel={parsed.skillsLevel} />
      <ThinkingTypeSection thinkingType={parsed.thinkingType} />
      <PersonalityTraitsSection personalityTraits={parsed.personalityTraits} />
      <CareerDevelopmentSection careerDevelopment={parsed.careerDevelopment} />
    </div>
  );
}

function RecommendationColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className={adminClassNames.panel.compactCard}>
      <p className={`text-sm font-semibold ${adminClassNames.text.heading}`}>{title}</p>
      <ul className={`mt-2 space-y-2 text-sm leading-relaxed ${adminClassNames.text.body}`}>
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2">
            <span
              className={`mt-2 size-1.5 shrink-0 rounded-full ${adminClassNames.switch.active}`}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
