export type AnalysisStatus = 'PENDING' | 'READY' | 'FAILED' | string;

export interface AnalysisPayload {
  status: AnalysisStatus;
  providerMode?: string | null;
  summary: unknown | null;
  rawText?: string | null;
  errorMessage?: string | null;
  generatedAt?: string | null;
}

interface SkillItem {
  name: string;
  level: 'low' | 'medium' | 'high';
  score?: number | null;
  description: string;
}

export interface AnalysisResult {
  skillsLevel: {
    title: string;
    summary: string;
    items: SkillItem[];
  };
  thinkingType: {
    title: string;
    type: string;
    description: string;
    strengths: string[];
  };
  personalityTraits: {
    title: string;
    traits: Array<{
      name: string;
      description: string;
      careerImpact: string;
    }>;
  };
  careerDevelopment: {
    summary: string;
    recommendedDirections: string[];
    developmentRecommendations: string[];
    professionalNextSteps: string[];
  };
}

const MAX_SKILLS_COUNT = 6;
const MAX_THINKING_STRENGTHS_COUNT = 4;
const MAX_TRAITS_COUNT = 6;
const MAX_RECOMMENDED_DIRECTIONS_COUNT = 6;
const MAX_DEVELOPMENT_RECOMMENDATIONS_COUNT = 6;
const MAX_PROFESSIONAL_NEXT_STEPS_COUNT = 3;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getString = (record: Record<string, unknown>, key: string) => {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value : null;
};

const normalizeListKey = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

const uniqueBy = <T>(items: T[], getKey: (item: T) => string) => {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = getKey(item);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
};

const getStringArray = (record: Record<string, unknown>, key: string, maxItems: number) => {
  const value = record[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return uniqueBy(
    value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0),
    normalizeListKey,
  ).slice(0, maxItems);
};

export const parseAnalysisResult = (value: unknown): AnalysisResult | null => {
  if (!isRecord(value)) {
    return null;
  }

  const skillsLevel = isRecord(value.skillsLevel) ? value.skillsLevel : null;
  const thinkingType = isRecord(value.thinkingType) ? value.thinkingType : null;
  const personalityTraits = isRecord(value.personalityTraits) ? value.personalityTraits : null;
  const careerDevelopment = isRecord(value.careerDevelopment) ? value.careerDevelopment : null;

  if (!skillsLevel || !thinkingType || !personalityTraits || !careerDevelopment) {
    return null;
  }

  const skillItems = Array.isArray(skillsLevel.items)
    ? skillsLevel.items
        .filter(isRecord)
        .map((item): SkillItem | null => {
          const name = getString(item, 'name');
          const description = getString(item, 'description');
          const level = item.level;

          if (
            !name ||
            !description ||
            (level !== 'low' && level !== 'medium' && level !== 'high')
          ) {
            return null;
          }

          const score = typeof item.score === 'number' ? item.score : null;

          return { name, description, level, score };
        })
        .filter((item): item is SkillItem => item !== null)
        .slice(0, MAX_SKILLS_COUNT)
    : [];

  const metaTraitNames = new Set([
    'дополнительные склонности',
    'общие выводы',
    'оценка по шкалам (1-5)',
    'оценка по шкалам',
    'рекомендации по развитию',
  ]);
  const parsedTraits = Array.isArray(personalityTraits.traits)
    ? personalityTraits.traits
        .filter(isRecord)
        .map((item) => {
          const name = getString(item, 'name');
          const description = getString(item, 'description');
          const careerImpact = getString(item, 'careerImpact');

          if (!name || !description || !careerImpact) {
            return null;
          }

          return { name, description, careerImpact };
        })
        .filter(
          (item): item is AnalysisResult['personalityTraits']['traits'][number] => item !== null,
        )
        .filter((item) => !metaTraitNames.has(normalizeListKey(item.name)))
    : [];
  const traits = uniqueBy(parsedTraits, (item) => normalizeListKey(item.name)).slice(
    0,
    MAX_TRAITS_COUNT,
  );

  const result: AnalysisResult = {
    skillsLevel: {
      title: getString(skillsLevel, 'title') ?? 'Текущий уровень базовых навыков',
      summary: getString(skillsLevel, 'summary') ?? '',
      items: skillItems,
    },
    thinkingType: {
      title: getString(thinkingType, 'title') ?? 'Тип мышления',
      type: getString(thinkingType, 'type') ?? '',
      description: getString(thinkingType, 'description') ?? '',
      strengths: getStringArray(thinkingType, 'strengths', MAX_THINKING_STRENGTHS_COUNT),
    },
    personalityTraits: {
      title: getString(personalityTraits, 'title') ?? 'Личностные особенности',
      traits,
    },
    careerDevelopment: {
      summary: getString(careerDevelopment, 'summary') ?? '',
      recommendedDirections: getStringArray(
        careerDevelopment,
        'recommendedDirections',
        MAX_RECOMMENDED_DIRECTIONS_COUNT,
      ),
      developmentRecommendations: getStringArray(
        careerDevelopment,
        'developmentRecommendations',
        MAX_DEVELOPMENT_RECOMMENDATIONS_COUNT,
      ),
      professionalNextSteps: getStringArray(
        careerDevelopment,
        'professionalNextSteps',
        MAX_PROFESSIONAL_NEXT_STEPS_COUNT,
      ),
    },
  };

  if (
    result.skillsLevel.items.length === 0 ||
    !result.thinkingType.type ||
    result.personalityTraits.traits.length === 0 ||
    result.careerDevelopment.developmentRecommendations.length === 0
  ) {
    return null;
  }

  return result;
};

export const prettyJson = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};
