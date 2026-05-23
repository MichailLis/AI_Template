import { CheckCircle2, Sparkles } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { adminClassNames } from '@/shared/ui/admin-design-tokens';

import { parseAnalysisResult, prettyJson } from '../lib/test-analysis-result-parser';

import {
  AnalysisStatusBadges,
  ReadyAnalysisSections,
  SectionCard,
  StatusMessage,
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
          <pre className={adminClassNames.code.softBlock}>{prettyJson(analysis.summary)}</pre>
        </SectionCard>
      ) : null}

      {analysis?.status === 'READY' && !parsed && !showStructuredFallback ? (
        <div className={adminClassNames.panel.empty}>
          Итог прохождения сохранен. Подробный анализ для этого теста пока не настроен.
        </div>
      ) : null}

      {showRawText && analysis?.rawText ? (
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
