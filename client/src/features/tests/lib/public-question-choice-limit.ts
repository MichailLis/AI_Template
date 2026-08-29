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
  if (typeof settings !== 'object' || settings === null || Array.isArray(settings)) {
    return null;
  }

  const value = (settings as Record<string, unknown>).maxChoices;

  // Deliberately identical to getMaxChoices in server/src/tests/tests-answer-validation.ts,
  // including the rejection of non-integers. Rounding a fractional cap here instead would
  // make the UI stricter than the server for 2.5, and for a value below 1 it would floor to
  // zero and lock the student out of answering at all.
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
};

/** True when the student has reached the cap and may only deselect from here. */
export const isChoiceLimitReached = (selectedCount: number, maxChoices: number | null): boolean =>
  maxChoices !== null && selectedCount >= maxChoices;
