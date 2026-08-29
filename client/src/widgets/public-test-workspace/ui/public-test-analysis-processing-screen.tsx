import { BrainCircuit, Check, CheckCircle2, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { polusAssets, type PublicBrandingConfig } from '@/features/tests';

import { PolusPublicLayout } from './polus/polus-public-layout';
import { analysisProcessingSteps } from './public-test-analysis-processing-steps';
import { PublicThemeLayout } from './public-theme-layout';

import type { ReactNode } from 'react';

const stepDurationMs = 8_000;
const longWaitThresholdMs = 35_000;

type ProcessingStepState = 'done' | 'current' | 'waiting';

interface PublicTestAnalysisProcessingScreenProps {
  startedAt: string | null;
  branding?: PublicBrandingConfig;
  phase?: 'processing' | 'ready';
  variant?: 'standard' | 'polus';
}

interface ProcessingScreenViewProps {
  branding?: PublicBrandingConfig;
  isReadyPhase: boolean;
  currentStepIndex: number;
  isLongWait: boolean;
}

const getStepState = (
  isReadyPhase: boolean,
  index: number,
  currentStepIndex: number,
): ProcessingStepState => {
  if (isReadyPhase || index < currentStepIndex) {
    return 'done';
  }

  if (index === currentStepIndex) {
    return 'current';
  }

  return 'waiting';
};

const getStandardStepIcon = (state: ProcessingStepState): ReactNode => {
  if (state === 'done') {
    return <Check className="h-4 w-4" />;
  }

  if (state === 'current') {
    return <LoaderCircle className="h-4 w-4 animate-spin" />;
  }

  return <span className="inline-block h-4 w-4 rounded-full border border-border/80" />;
};

const getPolusStepIcon = (state: ProcessingStepState) => {
  if (state === 'done') {
    return <Check className="h-4 w-4" />;
  }

  if (state === 'current') {
    return <LoaderCircle className="h-4 w-4 animate-spin" />;
  }

  return null;
};

const getPolusDescription = (isReadyPhase: boolean, isLongWait: boolean) => {
  if (isReadyPhase) {
    return 'Персональная карта уже готова и сейчас откроется.';
  }

  if (isLongWait) {
    return 'Пояснение занимает чуть больше времени. Профессор сверяет выводы и дописывает рекомендации.';
  }

  return 'Собираем ответы, ищем сильные стороны и готовим понятное пояснение результата. Страница обновится автоматически.';
};

const getProcessingStatusText = (isReadyPhase: boolean, isLongWait: boolean) => {
  if (isReadyPhase) {
    return 'Готово';
  }

  return isLongWait ? 'Дописываем пояснение' : 'В процессе';
};

const getStandardDescription = (isReadyPhase: boolean, isLongWait: boolean) => {
  if (isReadyPhase) {
    return 'Открываем персональный отчет по результатам теста.';
  }

  if (isLongWait) {
    return 'Анализ занимает чуть больше времени. Страница обновится автоматически, когда отчет будет готов.';
  }

  return 'Это может занять около минуты. Страница обновится автоматически, когда анализ будет готов.';
};

function PolusProcessingScreen({
  isReadyPhase,
  currentStepIndex,
  isLongWait,
}: ProcessingScreenViewProps) {
  const sectionLabel = isReadyPhase ? 'Отчет готов' : 'Профессор Полюс анализирует';
  const title = isReadyPhase ? 'Открываем карту развития' : 'Формируем отчет';
  const description = getPolusDescription(isReadyPhase, isLongWait);
  const statusText = getProcessingStatusText(isReadyPhase, isLongWait);

  return (
    <PolusPublicLayout view="result">
      <section className="polus-test-stage polus-result-stage">
        <div className="polus-state-view polus-processing-card">
          <div className="polus-processing-layout">
            <div className="polus-processing-copy">
              <p className="polus-section-label">{sectionLabel}</p>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>

            <div
              className={`polus-processing-professor${
                isReadyPhase ? '' : ' polus-processing-professor--thinking'
              }`}
              aria-hidden="true"
            >
              {isReadyPhase ? (
                <div className="polus-result-speech-bubble">
                  <span className="polus-result-speech-dot" />
                  <span className="polus-result-speech-dot" />
                  <span className="polus-result-speech-dot" />
                </div>
              ) : null}
              <img
                src={isReadyPhase ? polusAssets.professor : polusAssets.professorThinking}
                alt=""
                data-animated={isReadyPhase ? undefined : 'true'}
              />
            </div>
          </div>

          <div className="polus-processing-progress" aria-label="Статус обработки">
            <div className="polus-progress-line polus-progress-line--indeterminate">
              <span />
            </div>
            <div className="polus-processing-progress-meta">
              <span>Статус обработки</span>
              <strong>{statusText}</strong>
            </div>
          </div>

          <div className="polus-processing-steps" aria-label="Этапы подготовки">
            {analysisProcessingSteps.map((step, index) => {
              const stepState = getStepState(isReadyPhase, index, currentStepIndex);

              return (
                <div className="polus-processing-step" data-state={stepState} key={step.id}>
                  <span aria-hidden="true">{getPolusStepIcon(stepState)}</span>
                  <p>{step.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </PolusPublicLayout>
  );
}

function StandardProcessingScreen({
  branding,
  isReadyPhase,
  currentStepIndex,
  isLongWait,
}: ProcessingScreenViewProps) {
  const description = getStandardDescription(isReadyPhase, isLongWait);
  const statusText = isReadyPhase ? 'Готово' : 'В процессе';

  return (
    <PublicThemeLayout branding={branding} containerClassName="max-w-4xl py-8 md:py-10">
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
          <p className="text-sm text-muted-foreground md:text-base">{description}</p>
        </div>

        <div className="w-full space-y-2 rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/70">
            <div
              className={`h-full w-1/2 rounded-full bg-gradient-to-r ${
                isReadyPhase ? 'from-primary to-emerald-500' : 'from-primary to-accent'
              } ${isReadyPhase ? 'w-full' : 'animate-pulse'}`}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Статус обработки</span>
            <span>{statusText}</span>
          </div>
        </div>

        <div className="w-full rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Этапы подготовки
          </div>

          <div className="space-y-3">
            {analysisProcessingSteps.map((step, index) => {
              const stepState = getStepState(isReadyPhase, index, currentStepIndex);

              return (
                <div key={step.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 shrink-0 text-primary">
                    {getStandardStepIcon(stepState)}
                  </span>
                  <span
                    className={
                      stepState === 'current' ? 'text-foreground' : 'text-muted-foreground'
                    }
                  >
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

export function PublicTestAnalysisProcessingScreen({
  startedAt,
  branding = null,
  phase = 'processing',
  variant = 'standard',
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
  const currentStepIndex = isReadyPhase
    ? analysisProcessingSteps.length - 1
    : Math.min(analysisProcessingSteps.length - 1, Math.floor(elapsedMs / stepDurationMs));
  const isLongWait = !isReadyPhase && effectiveElapsedMs >= longWaitThresholdMs;
  const viewProps = { branding, isReadyPhase, currentStepIndex, isLongWait };

  return variant === 'polus' ? (
    <PolusProcessingScreen {...viewProps} />
  ) : (
    <StandardProcessingScreen {...viewProps} />
  );
}
