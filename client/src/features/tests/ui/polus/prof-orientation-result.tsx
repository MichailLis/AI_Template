import { parseProfOrientationMethodologyEnrichment } from './prof-orientation-llm-data';
import { getProfessorStatusText, getProfessorText } from './prof-orientation-result.helpers';
import {
  ProfOrientationHero,
  ProfOrientationMiniProjectCard,
  ProfOrientationProfessionsCard,
  ProfOrientationProfileCard,
  ProfOrientationScoreGrid,
} from './prof-orientation-result.sections';

import type { ProfOrientationSummary } from './prof-orientation-summary';

export function ProfOrientationResult({
  professionAtlasUrl,
  summary,
}: {
  professionAtlasUrl?: null | string;
  summary: ProfOrientationSummary;
}) {
  const primary = summary.primaryDirection;
  const headline = primary?.resultCard.headline ?? summary.profile.title;
  const meaning = primary?.resultCard.meaning ?? summary.profile.meaning;
  const llmAnalysis =
    summary.llm.status === 'ready'
      ? parseProfOrientationMethodologyEnrichment(summary.llm.analysis)
      : null;
  const professorSummary = getProfessorText({
    analysis: llmAnalysis,
    fallback:
      summary.llm.status === 'pending' ? getProfessorStatusText(summary.llm.status) : meaning,
    primary,
  });
  const bullets = primary?.resultCard.fitsIf ?? [];
  const actions = primary?.resultCard.tryActions ?? [];
  const profileItems = [...bullets, ...actions].slice(0, 4);
  const miniProject =
    llmAnalysis?.nextMiniProject ?? primary?.resultCard.miniProject ?? summary.profile.miniProject;

  return (
    <>
      <ProfOrientationHero headline={headline} professorSummary={professorSummary} />
      <ProfOrientationScoreGrid directions={summary.topDirections} />
      <ProfOrientationProfileCard
        analysis={llmAnalysis}
        items={profileItems}
        meaning={meaning}
        title={primary?.name ?? summary.profile.title}
      />
      {primary ? (
        <ProfOrientationProfessionsCard
          analysis={llmAnalysis}
          primary={primary}
          professionAtlasUrl={professionAtlasUrl}
        />
      ) : null}
      {miniProject ? (
        <ProfOrientationMiniProjectCard analysis={llmAnalysis} miniProject={miniProject} />
      ) : null}
    </>
  );
}
