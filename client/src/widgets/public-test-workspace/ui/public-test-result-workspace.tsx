import { BriefcaseBusiness, Download, ExternalLink, Gauge, Route, Target } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { parseAnalysisResult } from '@/features/tests';
import { useTestsPublicControllerGetSessionResult } from '@/shared/api/generated/tests-public/tests-public';
import { Button } from '@/shared/ui/button';

import { PublicTestAnalysisProcessingScreen } from './public-test-analysis-processing-screen';
import { PublicTestResultAnalysisView } from './public-test-result-analysis-view';
import { PublicThemeLayout } from './public-theme-layout';

import type { AnalysisResult } from '@/features/tests';
import type { PublicSessionResultResponseDto } from '@/shared/api/model';
import type { LucideIcon } from 'lucide-react';

interface HeroSignal {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
}

const handleExportPdf = () => {
  window.print();
};

const getTopSkill = (analysis: AnalysisResult | null) =>
  analysis?.skillsLevel.items
    .filter((item) => typeof item.score === 'number')
    .sort((left, right) => (right.score ?? 0) - (left.score ?? 0))[0] ?? null;

const getHeroSignals = (analysis: AnalysisResult | null): HeroSignal[] => {
  const topSkill = getTopSkill(analysis);
  const thinkingStrengths = analysis?.thinkingType.strengths.slice(0, 2).join(' · ');
  const topSkillScore =
    typeof topSkill?.score === 'number' ? `${topSkill.score}/100 по шкале анализа` : null;

  return [
    {
      icon: Gauge,
      label: 'Профиль',
      value: analysis?.thinkingType.type ?? 'Анализ результата',
      note: thinkingStrengths || 'Сводка по ответам',
    },
    {
      icon: Target,
      label: 'Сильная зона',
      value: topSkill?.name ?? 'Базовые навыки',
      note: topSkillScore ?? 'Оценивается моделью',
    },
    {
      icon: Route,
      label: 'Следующий фокус',
      value: analysis?.careerDevelopment.professionalNextSteps[0] ?? 'План развития',
      note: 'Конкретный шаг после теста',
    },
  ];
};

function HeroSignalCard({ icon: Icon, label, value, note }: HeroSignal) {
  return (
    <article className="public-result-signal">
      <div className="flex items-center gap-2">
        <span className="public-result-signal-icon">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{label}</p>
      </div>
      <p className="mt-3 text-base font-bold leading-snug text-foreground">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{note}</p>
    </article>
  );
}

function ResultHeroCopy() {
  return (
    <div className="relative min-w-0 max-w-3xl space-y-4">
      <div className="space-y-3">
        <h1 className="text-balance text-3xl font-black leading-tight md:text-5xl">
          Результат теста
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-white/78 md:text-base">
          Итог прохождения и анализ инженерно-технического профиля.
        </p>
      </div>
    </div>
  );
}

function ResultPdfButton({ className }: { className: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExportPdf}
      className={className}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      Скачать PDF
    </Button>
  );
}

function ResultHero() {
  return (
    <div className="public-result-hero relative overflow-hidden rounded-[1.5rem] px-5 py-6 text-white md:px-7 md:py-7">
      <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <ResultHeroCopy />
        <ResultPdfButton className="public-result-pdf-action w-fit shrink-0 rounded-xl border-white/25 bg-white/12 text-white shadow-sm backdrop-blur hover:bg-white/18 hover:text-white" />
      </div>
    </div>
  );
}

function ProfessionAtlasLink({ url }: { url: string }) {
  return (
    <aside className="rounded-2xl border border-border/70 bg-white/85 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-base font-bold text-foreground">Атлас профессий</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Вы можете ознакомиться с профессиями и спросом на них в Атласе профессий.
            </p>
          </div>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          Открыть Атлас профессий
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </aside>
  );
}

export function PublicTestResultWorkspace() {
  const { sessionToken } = useParams<{ sessionToken: string }>();

  const resultQuery = useTestsPublicControllerGetSessionResult(sessionToken ?? '', {
    query: {
      enabled: Boolean(sessionToken),
      retry: false,
      refetchInterval: (query) => {
        const data = query.state.data as PublicSessionResultResponseDto | undefined;
        return data?.analysis.status === 'PENDING' ? 3000 : false;
      },
    },
  });

  if (!sessionToken) {
    return (
      <PublicThemeLayout containerClassName="max-w-3xl">
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-10 text-sm text-red-700">
          Ссылка недействительна. Проверьте, что вы перешли по верной ссылке.
        </div>
      </PublicThemeLayout>
    );
  }

  if (resultQuery.isLoading) {
    return <PublicTestAnalysisProcessingScreen startedAt={null} />;
  }

  if (resultQuery.isError || !resultQuery.data) {
    return (
      <PublicThemeLayout containerClassName="max-w-3xl">
        <div
          className="flex min-h-[60vh] items-center justify-center px-4 py-10 text-center text-sm text-red-700"
          role="alert"
        >
          Не удалось загрузить результат. Обновите страницу позже или обратитесь к администратору.
        </div>
      </PublicThemeLayout>
    );
  }

  const result = resultQuery.data;

  if (result.analysis.status === 'PENDING') {
    return <PublicTestAnalysisProcessingScreen startedAt={result.finishedAt} />;
  }

  const parsedAnalysis = parseAnalysisResult(result.analysis.summary);
  const heroSignals = getHeroSignals(parsedAnalysis);

  return (
    <PublicThemeLayout containerClassName="public-result-page max-w-6xl py-6 md:py-8">
      <section className="public-glass public-result-shell rounded-[1.75rem] px-4 py-4 md:px-6 md:py-6">
        <header className="space-y-4">
          <ResultHero />

          <div className="public-result-signal-grid grid gap-3 lg:grid-cols-3">
            {heroSignals.map((signal) => (
              <HeroSignalCard key={signal.label} {...signal} />
            ))}
          </div>
        </header>

        <div className="mt-8 md:mt-9">
          <PublicTestResultAnalysisView analysis={result.analysis} />
        </div>

        {result.professionAtlasUrl ? (
          <div className="mt-8">
            <ProfessionAtlasLink url={result.professionAtlasUrl} />
          </div>
        ) : null}

        <div className="public-result-pdf-action mt-8 flex justify-center border-t border-border/60 pt-6">
          <ResultPdfButton className="rounded-xl px-5 shadow-sm" />
        </div>
      </section>
    </PublicThemeLayout>
  );
}
