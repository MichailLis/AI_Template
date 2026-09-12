import type { Prisma, TestQuestionType, TestScoringKind } from '@prisma/client';

/**
 * Содержимое версии теста — ровно то, что публикация копирует в новый черновик
 * (`publishTopic`, `cloneQuestionsToVersion`). Идентификаторы, номера версий и даты сюда не входят:
 * у клона они всегда другие, а содержимое совпадает.
 */
export const TOPIC_VERSION_CONTENT_SELECT = {
  title: true,
  description: true,
  analysisPromptVersionId: true,
  scoringKind: true,
  scoringConfig: true,
  questions: {
    orderBy: { order: 'asc' },
    select: {
      type: true,
      title: true,
      description: true,
      required: true,
      order: true,
      settings: true,
      options: {
        orderBy: { order: 'asc' },
        select: { label: true, value: true, weight: true, order: true },
      },
      sliderBands: {
        orderBy: { order: 'asc' },
        select: { minValue: true, maxValue: true, label: true, weight: true, order: true },
      },
    },
  },
} as const satisfies Prisma.TestTopicVersionSelect;

export interface TopicVersionContent {
  title: string;
  description: string | null;
  analysisPromptVersionId: number | null;
  scoringKind: TestScoringKind;
  scoringConfig: unknown;
  questions: Array<{
    type: TestQuestionType;
    title: string;
    description: string | null;
    required: boolean;
    order: number;
    settings: unknown;
    options: Array<{ label: string; value: string; weight: number; order: number }>;
    sliderBands: Array<{
      minValue: number;
      maxValue: number;
      label: string;
      weight: number;
      order: number;
    }>;
  }>;
}

const byOrder = (left: { order: number }, right: { order: number }) => left.order - right.order;

/** JSON с отсортированными ключами: порядок ключей в `settings` и `scoringConfig` не меняет смысла. */
const sortJsonKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortJsonKeys);
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nested]) => [key, sortJsonKeys(nested)]),
    );
  }

  return value;
};

/** Поля берутся явно, чтобы лишние поля выборки (`id`, `_count`) не делали клон «измененным». */
const toComparableContent = (content: TopicVersionContent) =>
  JSON.stringify(
    sortJsonKeys({
      title: content.title,
      description: content.description,
      analysisPromptVersionId: content.analysisPromptVersionId,
      scoringKind: content.scoringKind,
      scoringConfig: content.scoringConfig ?? null,
      questions: [...content.questions].sort(byOrder).map((question) => ({
        type: question.type,
        title: question.title,
        description: question.description,
        required: question.required,
        order: question.order,
        settings: question.settings ?? null,
        options: [...question.options]
          .sort(byOrder)
          .map(({ label, value, weight, order }) => ({ label, value, weight, order })),
        sliderBands: [...question.sliderBands]
          .sort(byOrder)
          .map(({ minValue, maxValue, label, weight, order }) => ({
            minValue,
            maxValue,
            label,
            weight,
            order,
          })),
      })),
    }),
  );

/**
 * Есть ли у черновика изменения относительно опубликованной версии. Публикация всегда создает
 * новый черновик-клон, поэтому само существование черновика изменений не означает.
 */
export const hasVersionContentChanges = (
  draft: TopicVersionContent,
  published: TopicVersionContent,
) => toComparableContent(draft) !== toComparableContent(published);
