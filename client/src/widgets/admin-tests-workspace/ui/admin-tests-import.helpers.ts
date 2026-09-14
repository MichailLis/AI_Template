import type { TestTopicListItem } from '@/features/tests';

export interface ProfOrientationV3PlusCopy {
  topic: TestTopicListItem;
  isArchived: boolean;
}

/**
 * Копии встроенной методики v3+ из активного списка и архива. Узнаются по виду подсчета: его задает
 * импорт, а название и описание копии администратор может переименовать.
 */
export const findProfOrientationV3PlusCopies = (
  activeTopics: TestTopicListItem[],
  archivedTopics: TestTopicListItem[],
): ProfOrientationV3PlusCopy[] => {
  const isCopy = (topic: TestTopicListItem) => topic.scoringKind === 'PROF_ORIENTATION_V3_PLUS';

  return [
    ...activeTopics.filter(isCopy).map((topic) => ({ topic, isArchived: false })),
    ...archivedTopics.filter(isCopy).map((topic) => ({ topic, isArchived: true })),
  ];
};
