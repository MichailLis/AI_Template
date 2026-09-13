export const PUBLIC_TEST_TIME_WARNING_SECONDS = 60;

// Округляем вверх: «0:00» появляется только тогда, когда срок попытки на сервере действительно прошел.
export const getRemainingSeconds = (expiresAt: string | null, nowMs: number) => {
  if (!expiresAt) {
    return null;
  }

  const expiresAtMs = Date.parse(expiresAt);

  if (!Number.isFinite(expiresAtMs)) {
    return null;
  }

  return Math.max(0, Math.ceil((expiresAtMs - nowMs) / 1000));
};

const padTimePart = (value: number) => String(value).padStart(2, '0');

export const formatRemainingTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return hours > 0
    ? `${hours}:${padTimePart(minutes)}:${padTimePart(seconds)}`
    : `${minutes}:${padTimePart(seconds)}`;
};

export const isPublicTestTimeWarning = (remainingSeconds: number | null) =>
  remainingSeconds !== null && remainingSeconds <= PUBLIC_TEST_TIME_WARNING_SECONDS;
