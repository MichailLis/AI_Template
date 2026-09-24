export interface PromptActiveTest {
  topicId: number;
  title: string;
  slug: string;
  onPublishedVersion: boolean;
}

interface PromptUsageTopic {
  id: number;
  slug: string;
  activePublishedVersion: {
    title: string;
    analysisPromptVersion: { promptId: number } | null;
  } | null;
  activeDraftVersion: {
    title: string;
    analysisPromptVersion: { promptId: number } | null;
  } | null;
}

interface PromptUsagePinnedVersion {
  title: string;
  analysisPromptVersion: { promptId: number } | null;
  topic: { id: number; slug: string };
}

interface PromptUsageRecoverableAnalysis {
  promptVersion: { promptId: number } | null;
  attempt: {
    topicVersion: {
      title: string;
      topic: { id: number; slug: string };
    };
  };
}

export function calculatePromptUsage(
  topics: PromptUsageTopic[],
  pinnedVersions: PromptUsagePinnedVersion[],
  recoverableAnalyses: PromptUsageRecoverableAnalysis[],
): Map<number, PromptActiveTest[]> {
  const testsByPromptId = new Map<number, PromptActiveTest[]>();

  const addTest = (promptId: number, test: PromptActiveTest) => {
    testsByPromptId.set(promptId, [...(testsByPromptId.get(promptId) ?? []), test]);
  };

  for (const topic of topics) {
    const published = topic.activePublishedVersion;
    const draft = topic.activeDraftVersion;
    const publishedPromptId = published?.analysisPromptVersion?.promptId;
    const draftPromptId = draft?.analysisPromptVersion?.promptId;

    if (published && publishedPromptId !== undefined) {
      addTest(publishedPromptId, {
        topicId: topic.id,
        title: published.title,
        slug: topic.slug,
        onPublishedVersion: true,
      });
    }

    if (draft && draftPromptId !== undefined && draftPromptId !== publishedPromptId) {
      addTest(draftPromptId, {
        topicId: topic.id,
        title: draft.title,
        slug: topic.slug,
        onPublishedVersion: false,
      });
    }
  }

  for (const pinned of pinnedVersions) {
    const promptId = pinned.analysisPromptVersion?.promptId;
    if (promptId === undefined) {
      continue;
    }

    const existing = (testsByPromptId.get(promptId) ?? []).find(
      (test) => test.topicId === pinned.topic.id,
    );

    if (!existing) {
      addTest(promptId, {
        topicId: pinned.topic.id,
        title: pinned.title,
        slug: pinned.topic.slug,
        onPublishedVersion: true,
      });
    } else if (!existing.onPublishedVersion) {
      existing.onPublishedVersion = true;
    }
  }

  for (const analysis of recoverableAnalyses) {
    const promptId = analysis.promptVersion?.promptId;
    if (promptId === undefined) {
      continue;
    }

    const version = analysis.attempt.topicVersion;
    const existing = (testsByPromptId.get(promptId) ?? []).find(
      (test) => test.topicId === version.topic.id,
    );

    if (!existing) {
      addTest(promptId, {
        topicId: version.topic.id,
        title: version.title,
        slug: version.topic.slug,
        onPublishedVersion: true,
      });
    } else if (!existing.onPublishedVersion) {
      existing.onPublishedVersion = true;
    }
  }

  return testsByPromptId;
}
