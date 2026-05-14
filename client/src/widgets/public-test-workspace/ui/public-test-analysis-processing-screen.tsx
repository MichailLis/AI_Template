import { BrainCircuit, Check, CheckCircle2, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { analysisProcessingSteps } from './public-test-analysis.mock';
import { PublicThemeLayout } from './public-theme-layout';

import type { ReactNode } from 'react';

const stepDurationMs = 12_000;

interface PublicTestAnalysisProcessingScreenProps {
  startedAt: string | null;
  phase?: 'processing' | 'ready';
}

export function PublicTestAnalysisProcessingScreen({
  startedAt,
  phase = 'processing',
}: PublicTestAnalysisProcessingScreenProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const isReadyPhase = phase === 'ready';

  useEffect(() => {
    if (isReadyPhase) {
      return;
    }

    const startMs = startedAt ? new Date(startedAt).getTime() : Date.now();

    const updateElapsed = () => {
      const diff = Date.now() - startMs;
      setElapsedMs(diff > 0 ? diff : 0);
    };

    updateElapsed();

    const timer = window.setInterval(updateElapsed, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isReadyPhase, startedAt]);

  const effectiveElapsedMs = isReadyPhase
    ? analysisProcessingSteps.length * stepDurationMs
    : elapsedMs;
  const computedProgress = Math.round(
    (effectiveElapsedMs / (analysisProcessingSteps.length * stepDurationMs)) * 100,
  );
  const progress = isReadyPhase ? 100 : Math.min(95, computedProgress);
  const currentStepIndex = isReadyPhase
    ? analysisProcessingSteps.length - 1
    : Math.min(analysisProcessingSteps.length - 1, Math.floor(elapsedMs / stepDurationMs));

  return (
    <PublicThemeLayout containerClassName="max-w-4xl py-8 md:py-10">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
          <div className="relative rounded-2xl bg-card/90 p-4 shadow-lg ring-1 ring-border/60">
            {isReadyPhase ? (
              <CheckCircle2 className="h-10 w-10 animate-pulse text-primary" />
            ) : (
              <BrainCircuit className="h-10 w-10 animate-pulse text-primary" />
            )}
          </div>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
            {isReadyPhase ? 'Анализ готов' : 'Формируем отчет'}
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            {isReadyPhase
              ? 'Открываем персональный отчет по результатам теста.'
              : 'Это может занять около минуты. Страница обновится автоматически, когда анализ будет готов.'}
          </p>
        </div>

        <div className="w-full space-y-2 rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/70">
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${
                isReadyPhase ? 'from-primary to-emerald-500' : 'from-primary to-accent'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Статус обработки</span>
            <span>{progress}%</span>
          </div>
        </div>

        <div className="w-full rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Этапы подготовки
          </div>

          <div className="space-y-3">
            {analysisProcessingSteps.map((step, index) => {
              const isCompleted = isReadyPhase || index < currentStepIndex;
              const isCurrent = !isReadyPhase && index === currentStepIndex;

              let statusIcon: ReactNode;
              if (isCompleted) {
                statusIcon = <Check className="h-4 w-4" />;
              } else if (isCurrent) {
                statusIcon = <LoaderCircle className="h-4 w-4 animate-spin" />;
              } else {
                statusIcon = (
                  <span className="inline-block h-4 w-4 rounded-full border border-border/80" />
                );
              }

              return (
                <div key={step.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 shrink-0 text-primary">{statusIcon}</span>
                  <span className={isCurrent ? 'text-foreground' : 'text-muted-foreground'}>
                    {step.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PublicThemeLayout>
  );
}
