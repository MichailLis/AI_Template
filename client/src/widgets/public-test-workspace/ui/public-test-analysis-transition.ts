import { safeStorage } from '@/shared/lib/storage';

const analysisTransitionStorageKey = 'public-test-analysis-transition';

interface AnalysisTransitionPayload {
  sessionToken: string;
  startedAtMs: number;
}

const readPayload = (): AnalysisTransitionPayload | null => {
  const rawValue = safeStorage.getItem(analysisTransitionStorageKey);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<AnalysisTransitionPayload>;

    if (
      typeof parsed.sessionToken === 'string' &&
      typeof parsed.startedAtMs === 'number' &&
      Number.isFinite(parsed.startedAtMs)
    ) {
      return {
        sessionToken: parsed.sessionToken,
        startedAtMs: parsed.startedAtMs,
      };
    }

    safeStorage.removeItem(analysisTransitionStorageKey);
  } catch {
    safeStorage.removeItem(analysisTransitionStorageKey);
  }

  return null;
};

export const markPublicTestAnalysisTransition = (sessionToken: string) => {
  const payload: AnalysisTransitionPayload = {
    sessionToken,
    startedAtMs: Date.now(),
  };

  safeStorage.setItem(analysisTransitionStorageKey, JSON.stringify(payload));
};

export const getPublicTestAnalysisTransitionRemainingMs = (
  sessionToken: string,
  minDurationMs: number,
) => {
  const payload = readPayload();
  if (!payload || payload.sessionToken !== sessionToken) {
    return 0;
  }

  const elapsedMs = Date.now() - payload.startedAtMs;
  const remainingMs = minDurationMs - elapsedMs;

  return remainingMs > 0 ? remainingMs : 0;
};

export const clearPublicTestAnalysisTransition = (sessionToken: string) => {
  const payload = readPayload();
  if (payload && payload.sessionToken === sessionToken) {
    safeStorage.removeItem(analysisTransitionStorageKey);
  }
};
