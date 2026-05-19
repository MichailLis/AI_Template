import { z } from 'zod';

const NonEmptyStringSchema = z.string().trim().min(1);
const PROFESSOR_SUMMARY_MAX_LENGTH = 420;
const ProfessorSummarySchema = z.string().trim().min(24).max(PROFESSOR_SUMMARY_MAX_LENGTH);
const MAX_METHOD_SIGNALS = 5;
const MAX_FIRST_STEPS = 5;
const MAX_LEARNING_ITEMS = 5;
const MAX_PROFESSION_NOTES = 4;
const MAX_CAUTIONS = 3;

export const ProfOrientationV3PlusEnrichmentSchema = z.object({
  professorSummary: ProfessorSummarySchema,
  summary: NonEmptyStringSchema,
  confidenceComment: NonEmptyStringSchema,
  methodSignals: z.array(NonEmptyStringSchema).min(2).max(MAX_METHOD_SIGNALS),
  firstSteps: z.array(NonEmptyStringSchema).min(2).max(MAX_FIRST_STEPS),
  learningPlan: z.array(NonEmptyStringSchema).min(2).max(MAX_LEARNING_ITEMS),
  professionNotes: z.array(NonEmptyStringSchema).max(MAX_PROFESSION_NOTES),
  nextMiniProject: NonEmptyStringSchema,
  cautions: z.array(NonEmptyStringSchema).max(MAX_CAUTIONS),
});

const stringProperty = {
  type: 'string',
  minLength: 1,
} as const;

const professorSummaryProperty = {
  type: 'string',
  minLength: 24,
  maxLength: PROFESSOR_SUMMARY_MAX_LENGTH,
} as const;

const stringArrayProperty = (minItems: number, maxItems: number) =>
  ({
    type: 'array',
    minItems,
    maxItems,
    items: stringProperty,
  }) as const;

export const ProfOrientationV3PlusEnrichmentJsonSchema = {
  name: 'prof_orientation_v3_plus_methodology_enrichment',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'professorSummary',
      'summary',
      'confidenceComment',
      'methodSignals',
      'firstSteps',
      'learningPlan',
      'professionNotes',
      'nextMiniProject',
      'cautions',
    ],
    properties: {
      professorSummary: professorSummaryProperty,
      summary: stringProperty,
      confidenceComment: stringProperty,
      methodSignals: stringArrayProperty(2, MAX_METHOD_SIGNALS),
      firstSteps: stringArrayProperty(2, MAX_FIRST_STEPS),
      learningPlan: stringArrayProperty(2, MAX_LEARNING_ITEMS),
      professionNotes: stringArrayProperty(0, MAX_PROFESSION_NOTES),
      nextMiniProject: stringProperty,
      cautions: stringArrayProperty(0, MAX_CAUTIONS),
    },
  },
} as const;

export type ProfOrientationV3PlusEnrichment = z.infer<typeof ProfOrientationV3PlusEnrichmentSchema>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toTrimmedString = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const toDisplayProfessorSummary = (value: unknown, fallback: unknown) => {
  const candidate = toTrimmedString(value) ?? '';

  if (candidate.length >= 24) {
    return candidate.length <= PROFESSOR_SUMMARY_MAX_LENGTH
      ? candidate
      : `${candidate.slice(0, PROFESSOR_SUMMARY_MAX_LENGTH - 3).trimEnd()}...`;
  }

  const fallbackText = toTrimmedString(fallback) ?? '';

  if (!fallbackText) {
    return candidate;
  }

  return fallbackText.length <= PROFESSOR_SUMMARY_MAX_LENGTH
    ? fallbackText
    : `${fallbackText.slice(0, PROFESSOR_SUMMARY_MAX_LENGTH - 3).trimEnd()}...`;
};

const toProfessionNote = (value: unknown) => {
  const directValue = toTrimmedString(value);
  if (directValue) {
    return directValue;
  }

  if (!isRecord(value)) {
    return null;
  }

  const title = toTrimmedString(value.title) ?? toTrimmedString(value.profession);
  const note =
    toTrimmedString(value.note) ??
    toTrimmedString(value.description) ??
    toTrimmedString(value.comment) ??
    toTrimmedString(value.summary) ??
    toTrimmedString(value.text);

  if (title && note) {
    return `${title}: ${note}`;
  }

  return title ?? note;
};

const toStringArray = (
  value: unknown,
  maxItems: number,
  itemMapper: (item: unknown) => string | null = toTrimmedString,
) =>
  Array.isArray(value)
    ? value
        .map(itemMapper)
        .filter((item): item is string => Boolean(item))
        .slice(0, maxItems)
    : [];

export const parseProfOrientationV3PlusEnrichment = (
  value: unknown,
): ProfOrientationV3PlusEnrichment => {
  const normalizedValue = isRecord(value)
    ? (() => {
        const firstSteps = toStringArray(value.firstSteps, MAX_FIRST_STEPS);
        const summary = toTrimmedString(value.summary);

        return {
          ...value,
          professorSummary: toDisplayProfessorSummary(value.professorSummary, value.summary),
          summary,
          confidenceComment: toTrimmedString(value.confidenceComment) ?? summary,
          methodSignals: toStringArray(value.methodSignals, MAX_METHOD_SIGNALS),
          firstSteps,
          learningPlan: toStringArray(value.learningPlan, MAX_LEARNING_ITEMS),
          professionNotes: toStringArray(
            value.professionNotes,
            MAX_PROFESSION_NOTES,
            toProfessionNote,
          ),
          nextMiniProject:
            toTrimmedString(value.nextMiniProject) ?? firstSteps[0] ?? toTrimmedString(summary),
          cautions: toStringArray(value.cautions, MAX_CAUTIONS),
        };
      })()
    : value;

  return ProfOrientationV3PlusEnrichmentSchema.parse(normalizedValue);
};
