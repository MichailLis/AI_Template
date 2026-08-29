/**
 * A MULTI_CHOICE question may cap how many options a student can pick, via
 * `settings.maxChoices`. The server enforces the cap in tests-answer-validation.ts and
 * rejects an over-long answer, so any public template that lets the student exceed it
 * produces a rejection they could not have anticipated.
 *
 * Both public templates read the cap through this helper so they cannot drift apart on
 * a rule that belongs to the domain rather than to a visual style.
 */
export const getMaxChoices = (settings: unknown): number | null => {
  if (typeof settings !== 'object' || settings === null) {
    return null;
  }

  const value = (settings as Record<string, unknown>).maxChoices;

  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.floor(value);
};

/** True when the student has reached the cap and may only deselect from here. */
export const isChoiceLimitReached = (selectedCount: number, maxChoices: number | null): boolean =>
  maxChoices !== null && selectedCount >= maxChoices;
