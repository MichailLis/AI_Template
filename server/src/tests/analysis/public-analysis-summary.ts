import {
  MAX_DEVELOPMENT_RECOMMENDATIONS_COUNT,
  MAX_PROFESSIONAL_NEXT_STEPS_COUNT,
  MAX_RECOMMENDED_DIRECTIONS_COUNT,
  MAX_SKILLS_COUNT,
  MAX_THINKING_STRENGTHS_COUNT,
  MAX_TRAITS_COUNT,
  TestAnalysisSkillLevelSchema,
} from '../../common/analysis/test-analysis-result.contract';
import { isRecord } from '../../common/type-guards';
import {
  PublicProfOrientationAtlasSchema,
  PublicProfOrientationEnrichmentSchema,
  PublicProfOrientationSummarySchema,
  type PublicAiAnalysisSummary,
  type PublicAnalysisSummary,
  type PublicProfOrientationSummary,
} from '../dto/tests-public-result.dto';
import {
  getProfOrientationLlmStatus,
  isProfOrientationV3PlusSummary,
} from '../prof-orientation-v3-plus/scoring';
import type { ProfOrientationSummary } from '../prof-orientation-v3-plus/types';

/**
 * Projection of a stored `summary` onto what a student may see. The stored value is Prisma JSON
 * written by three independent phases (algorithm, atlas, LLM), so it is read as `unknown` and
 * every public field is picked through a schema, never deleted from the stored object.
 */

export const NO_PUBLIC_ANALYSIS_SUMMARY: PublicAnalysisSummary = { resultKind: 'none' };

const toProfOrientationEnrichment = (llm: unknown) =>
  PublicProfOrientationEnrichmentSchema.safeParse(isRecord(llm) ? llm.analysis : undefined).data ??
  null;

// A broken optional section (atlas, LLM text) must not hide the result the algorithm computed.
const toPublicProfOrientationSummary = (
  stored: ProfOrientationSummary,
): PublicProfOrientationSummary | null => {
  const parsed = PublicProfOrientationSummarySchema.safeParse({
    ...stored,
    llm: {
      status: getProfOrientationLlmStatus(stored),
      analysis: toProfOrientationEnrichment(stored.llm),
    },
    atlas: PublicProfOrientationAtlasSchema.safeParse(stored.atlas).data ?? null,
  });

  return parsed.success ? parsed.data : null;
};

const readText = (record: Record<string, unknown>, key: string) => {
  const value = record[key];

  return typeof value === 'string' && value.trim() ? value : null;
};

const toListKey = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

const dedupeBy = <T>(items: T[], getKey: (item: T) => string) => {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = getKey(item);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const readTextList = (record: Record<string, unknown>, key: string, maxItems: number) => {
  const value = record[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return dedupeBy(
    value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0),
    toListKey,
  ).slice(0, maxItems);
};

// Section headings the model sometimes emits as if they were personality traits.
const META_TRAIT_NAMES = new Set([
  'дополнительные склонности',
  'общие выводы',
  'оценка по шкалам (1-5)',
  'оценка по шкалам',
  'рекомендации по развитию',
]);

const toSkillItem = (item: Record<string, unknown>) => {
  const name = readText(item, 'name');
  const description = readText(item, 'description');
  const level = TestAnalysisSkillLevelSchema.safeParse(item.level).data;

  if (!name || !description || !level) {
    return null;
  }

  return { name, description, level, score: typeof item.score === 'number' ? item.score : null };
};

const toTrait = (item: Record<string, unknown>) => {
  const name = readText(item, 'name');
  const description = readText(item, 'description');
  const careerImpact = readText(item, 'careerImpact');

  return name && description && careerImpact && !META_TRAIT_NAMES.has(toListKey(name))
    ? { name, description, careerImpact }
    : null;
};

const toLegacyIntroduction = (
  thinkingType: Record<string, unknown>,
  skillsLevel: Record<string, unknown>,
) => {
  const thinkingTypeName = readText(thinkingType, 'type');
  const skillsSummary = readText(skillsLevel, 'summary');

  if (thinkingTypeName && skillsSummary) {
    return `По результатам теста сформирован персональный анализ: ${thinkingTypeName.toLocaleLowerCase()}. ${skillsSummary}`;
  }

  return (
    skillsSummary ??
    'По результатам теста сформирован персональный анализ сильных сторон, особенностей мышления и возможных направлений развития.'
  );
};

/**
 * Analyses saved before `introduction` existed, or with the lists the model once overfilled, are
 * still readable by students (a result stays available while its link does), so this tolerates
 * what `TestAnalysisResultSchema` rejects today. `null` means there is nothing worth showing.
 */
const toPublicAiAnalysisSummary = (stored: unknown): PublicAiAnalysisSummary | null => {
  if (!isRecord(stored)) {
    return null;
  }

  const { skillsLevel, thinkingType, personalityTraits, careerDevelopment } = stored;

  if (
    !isRecord(skillsLevel) ||
    !isRecord(thinkingType) ||
    !isRecord(personalityTraits) ||
    !isRecord(careerDevelopment)
  ) {
    return null;
  }

  const skillItems = (Array.isArray(skillsLevel.items) ? skillsLevel.items : [])
    .filter(isRecord)
    .map(toSkillItem)
    .filter((item) => item !== null)
    .slice(0, MAX_SKILLS_COUNT);
  const traits = dedupeBy(
    (Array.isArray(personalityTraits.traits) ? personalityTraits.traits : [])
      .filter(isRecord)
      .map(toTrait)
      .filter((item) => item !== null),
    (item) => toListKey(item.name),
  ).slice(0, MAX_TRAITS_COUNT);
  const developmentRecommendations = readTextList(
    careerDevelopment,
    'developmentRecommendations',
    MAX_DEVELOPMENT_RECOMMENDATIONS_COUNT,
  );
  const thinkingTypeName = readText(thinkingType, 'type');

  if (
    skillItems.length === 0 ||
    !thinkingTypeName ||
    traits.length === 0 ||
    developmentRecommendations.length === 0
  ) {
    return null;
  }

  return {
    resultKind: 'ai_analysis',
    introduction:
      readText(stored, 'introduction') ?? toLegacyIntroduction(thinkingType, skillsLevel),
    skillsLevel: {
      title: readText(skillsLevel, 'title') ?? 'Текущий уровень базовых навыков',
      summary: readText(skillsLevel, 'summary') ?? '',
      items: skillItems,
    },
    thinkingType: {
      title: readText(thinkingType, 'title') ?? 'Тип мышления',
      type: thinkingTypeName,
      description: readText(thinkingType, 'description') ?? '',
      strengths: readTextList(thinkingType, 'strengths', MAX_THINKING_STRENGTHS_COUNT),
    },
    personalityTraits: {
      title: readText(personalityTraits, 'title') ?? 'Личностные особенности',
      traits,
    },
    careerDevelopment: {
      summary: readText(careerDevelopment, 'summary') ?? '',
      recommendedDirections: readTextList(
        careerDevelopment,
        'recommendedDirections',
        MAX_RECOMMENDED_DIRECTIONS_COUNT,
      ),
      developmentRecommendations,
      professionalNextSteps: readTextList(
        careerDevelopment,
        'professionalNextSteps',
        MAX_PROFESSIONAL_NEXT_STEPS_COUNT,
      ),
    },
  };
};

export const toPublicAnalysisSummary = (stored: unknown): PublicAnalysisSummary => {
  const projected = isProfOrientationV3PlusSummary(stored)
    ? toPublicProfOrientationSummary(stored)
    : toPublicAiAnalysisSummary(stored);

  return projected ?? NO_PUBLIC_ANALYSIS_SUMMARY;
};
