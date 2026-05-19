import { TestAnalysisResultView } from '@/features/tests';

import { ProfOrientationResult } from './polus/polus-prof-orientation-result';
import { parseProfOrientationSummary } from './polus/polus-prof-orientation-summary';

import type { AnalysisPayload } from '@/features/tests';

import './public-theme.css';
import './polus/polus-public-theme.css';

interface PublicTestStudentAnalysisViewProps {
  analysis: AnalysisPayload | null;
  generatedAtLabel?: string;
  professionAtlasUrl?: null | string;
}

export function PublicTestStudentAnalysisView({
  analysis,
  generatedAtLabel,
  professionAtlasUrl = null,
}: PublicTestStudentAnalysisViewProps) {
  const profOrientationSummary = parseProfOrientationSummary(analysis?.summary ?? null);

  if (analysis?.status === 'READY' && profOrientationSummary) {
    return (
      <div className="theme-public theme-public--polus polus-admin-result-preview min-w-0 rounded-[2rem] p-4 md:p-6">
        <section className="polus-test-stage polus-result-stage">
          <div className="polus-state-view">
            <div className="polus-result-layout">
              <p className="polus-section-label">Персональная карта развития</p>
              <ProfOrientationResult
                professionAtlasUrl={professionAtlasUrl}
                summary={profOrientationSummary}
              />
            </div>
          </div>
        </section>
      </div>
    );
  }

  return <TestAnalysisResultView analysis={analysis} generatedAtLabel={generatedAtLabel} />;
}
