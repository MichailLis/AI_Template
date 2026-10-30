import { parseProfOrientationMethodologyEnrichment } from './prof-orientation-llm-data';
import {
  getProfessorStatusText,
  getProfessorText,
  normalizeProfessionTitle,
} from './prof-orientation-result.helpers';
import {
  ProfOrientationHero,
  ProfOrientationAtlasRecommendationsCard,
  ProfOrientationMiniProjectCard,
  ProfOrientationProfessionsCard,
  ProfOrientationProfileCard,
  ProfOrientationScoreGrid,
} from './prof-orientation-result.sections';

import type { ProfOrientationSummary } from './prof-orientation-summary';

type ProfOrientationProfession = NonNullable<
  ProfOrientationSummary['primaryDirection']
>['professions'][number];

const getKeyProfessions = (summary: ProfOrientationSummary): ProfOrientationProfession[] => {
  if (summary.profile.type !== 'mixed_profile') {
    return summary.primaryDirection?.professions ?? [];
  }

  const seen = new Set<string>();

  return summary.topDirections
    .slice(0, 2)
    .map((direction) => direction.professions[0])
    .filter((profession): profession is ProfOrientationProfession => Boolean(profession))
    .filter((profession) => {
      const key = profession.code || normalizeProfessionTitle(profession.title);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
};

const getAtlasProfession = (
  summary: ProfOrientationSummary,
  profession: ProfOrientationProfession,
) => {
  const professionTitle = normalizeProfessionTitle(profession.title);

  return (
    summary.atlas?.professions.find(
      (atlasProfession) =>
        normalizeProfessionTitle(atlasProfession.requestedTitle) === professionTitle ||
        normalizeProfessionTitle(atlasProfession.title) === professionTitle,
    ) ?? null
  );
};

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
  const keyProfessions = getKeyProfessions(summary).map((profession) => {
    const atlasProfession = getAtlasProfession(summary, profession);

    return {
      ...profession,
      atlas: atlasProfession,
      atlasUrl: atlasProfession?.url ?? null,
    };
  });
  const hasAtlasRecommendations = Boolean(
    summary.atlas &&
    [summary.atlas.enterprises, summary.atlas.events, summary.atlas.institutions].some(
      (items) => items.length > 0,
    ),
  );
  const hasAtlasProfessionLinks = keyProfessions.some((profession) => Boolean(profession.atlasUrl));

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
      {keyProfessions.length > 0 ? (
        <ProfOrientationProfessionsCard
          analysis={llmAnalysis}
          professions={keyProfessions}
          professionAtlasUrl={
            hasAtlasRecommendations || hasAtlasProfessionLinks ? null : professionAtlasUrl
          }
        />
      ) : null}
      <ProfOrientationAtlasRecommendationsCard atlas={summary.atlas} />
      {miniProject ? (
        <ProfOrientationMiniProjectCard analysis={llmAnalysis} miniProject={miniProject} />
      ) : null}
    </>
  );
}
