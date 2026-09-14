import { CheckCircle2, Sparkles } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { adminClassNames } from '@/shared/ui/admin-design-tokens';

import { parseAnalysisResult, prettyJson } from '../lib/test-analysis-result-parser';

import {
  AnalysisStatusBadges,
  ReadyAnalysisSections,
  SectionCard,
  StatusMessage,
  TechnicalDetailsSection,
} from './test-analysis-result-view.sections';

import type { TestAnalysisResultViewProps } from './test-analysis-result-view.model';

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
  /**
   * Только заглушка заведомо не содержит анализа. У остальных видов непарсящаяся сводка всё ещё
   * может нести содержание в `rawText`, поэтому прятать его нельзя.
   */
  const hasContentlessReadyAnalysis =
    analysis?.status === 'READY' && !parsed && analysis.resultKind === 'STUB';
  const contentlessExplanation =
    'Содержательного анализа нет: к версии теста не подключен промпт, участник увидел только заглушку.';
  const hasUnparsedReadyAnalysis =
    analysis?.status === 'READY' && !parsed && !hasContentlessReadyAnalysis;

  return (
    <div className={cn('space-y-4', className)}>
      <AnalysisStatusBadges
        analysis={analysis}
        showProviderBadge={showProviderBadge}
        generatedAtLabel={generatedAtLabel}
      />

      <StatusMessage analysis={analysis} />

      {analysis?.status === 'READY' && parsed ? <ReadyAnalysisSections parsed={parsed} /> : null}

      {/**
       * Запись готова, но содержания в ней нет — обычно это заглушка без подключённого промпта.
       * Раньше здесь стоял сырой JSON и служебный текст провайдера: админ видел «анализ готов» и
       * непонятную техническую простыню вместо ответа, что случилось.
       */}
      {hasContentlessReadyAnalysis ? (
        <>
          <div className={adminClassNames.panel.empty}>{contentlessExplanation}</div>
          {showStructuredFallback ? (
            <TechnicalDetailsSection summary={analysis.summary} rawText={analysis.rawText} />
          ) : null}
        </>
      ) : null}

      {hasUnparsedReadyAnalysis && showStructuredFallback ? (
        <SectionCard icon={Sparkles} title="Структурированные данные анализа">
          <pre className={adminClassNames.code.softBlock}>{prettyJson(analysis.summary)}</pre>
        </SectionCard>
      ) : null}

      {hasUnparsedReadyAnalysis && !showStructuredFallback ? (
        <div className={adminClassNames.panel.empty}>
          Итог прохождения сохранен. Подробный анализ для этого теста пока не настроен.
        </div>
      ) : null}

      {showRawText && !hasContentlessReadyAnalysis && analysis?.rawText ? (
        <SectionCard icon={CheckCircle2} title="Текст анализа">
          <p
            className={`whitespace-pre-wrap text-sm leading-relaxed ${adminClassNames.text.heading}`}
          >
            {analysis.rawText}
          </p>
        </SectionCard>
      ) : null}

      {showErrorDetails && analysis?.errorMessage ? (
        <div className={adminClassNames.panel.dangerInline}>{analysis.errorMessage}</div>
      ) : null}
    </div>
  );
}
