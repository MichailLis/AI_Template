interface DraftAutosaveState {
  isAutoSavingDraft: boolean;
  lastAutoSavedAt: string | null;
}

export const buildAutosaveHint = (draftAutosave: DraftAutosaveState): string | null => {
  if (draftAutosave.isAutoSavingDraft) {
    return 'Автосохранение...';
  }

  if (draftAutosave.lastAutoSavedAt) {
    return `Автосохранено в ${draftAutosave.lastAutoSavedAt}`;
  }

  return null;
};

export const resolveNextTopicAfterDelete = (
  topics: Array<{ id: number }>,
  deletedTopicId: number,
) => {
  return topics.find((topic) => topic.id !== deletedTopicId)?.id ?? null;
};
