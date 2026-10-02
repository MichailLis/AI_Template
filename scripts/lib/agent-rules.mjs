/**
 * Pure logic behind the agent-rule registry check in `npm run verify:ai-guide`.
 *
 * `template/agent-rules.json` lists every rule an agent must see without opening another file.
 * The instruction files are prose, edited by hand and by agents, and a rule that disappears from
 * them disappears silently: nothing fails, the next session just never hears about it. The registry
 * turns that into a red gate. Each rule carries an `anchor` — a phrase that must be present in the
 * always-loaded text — so deleting or rewording a rule out of existence is caught at the next run.
 *
 * No I/O here: the caller supplies the registry and the file contents.
 */

const GROUPS = new Set(['A', 'B']);

/** Markdown wraps lines freely, so an anchor may be split by a newline and indentation. */
export const normalizeWhitespace = (text) => text.replace(/\s+/g, ' ').trim();

const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';

/**
 * Validates the registry itself. A group A rule claims a gate enforces it, so it must name one;
 * a group B rule is prose-only by definition and must not pretend otherwise.
 *
 * @param {unknown} registry
 * @returns {string[]} error messages, empty when the registry is well-formed
 */
export const validateRegistry = (registry) => {
  if (typeof registry !== 'object' || registry === null || !Array.isArray(registry.rules)) {
    return ['agent-rules.json: expected an object with a "rules" array'];
  }

  const errors = [];

  if (
    !Array.isArray(registry.alwaysLoadedFiles) ||
    registry.alwaysLoadedFiles.length === 0 ||
    !registry.alwaysLoadedFiles.every(isNonEmptyString)
  ) {
    errors.push('agent-rules.json: "alwaysLoadedFiles" must be a non-empty array of file names');
  }

  if (registry.rules.length === 0) {
    errors.push('agent-rules.json: "rules" must not be empty');
  }

  const seen = new Set();

  for (const [index, rule] of registry.rules.entries()) {
    const label = isNonEmptyString(rule?.id) ? `rule "${rule.id}"` : `rule #${index + 1}`;

    if (!isNonEmptyString(rule?.id)) {
      errors.push(`agent-rules.json: ${label} has no id`);
    } else if (seen.has(rule.id)) {
      errors.push(`agent-rules.json: duplicate id "${rule.id}"`);
    } else {
      seen.add(rule.id);
    }

    if (!GROUPS.has(rule?.group)) {
      errors.push(`agent-rules.json: ${label} must have group "A" (gated) or "B" (prose only)`);
    }

    if (!isNonEmptyString(rule?.rule)) {
      errors.push(`agent-rules.json: ${label} must state the rule in one sentence`);
    }

    if (!isNonEmptyString(rule?.anchor)) {
      errors.push(`agent-rules.json: ${label} must have an anchor`);
    }

    const enforcedBy = Array.isArray(rule?.enforcedBy) ? rule.enforcedBy : null;

    if (!enforcedBy || !enforcedBy.every(isNonEmptyString)) {
      errors.push(`agent-rules.json: ${label} must have an "enforcedBy" array of strings`);
    } else if (rule.group === 'A' && enforcedBy.length === 0) {
      errors.push(`agent-rules.json: ${label} is group A but names no gate in "enforcedBy"`);
    } else if (rule.group === 'B' && enforcedBy.length > 0) {
      errors.push(`agent-rules.json: ${label} is group B but lists a gate; move it to group A`);
    }
  }

  return errors;
};

/**
 * Names in `enforcedBy` that are neither an npm script nor a known non-script enforcer. A rule
 * that cites a gate which does not exist is unenforced while claiming otherwise.
 *
 * @param {{ rules: Array<{ id: string, enforcedBy: string[] }> }} registry
 * @param {string[]} knownEnforcers
 * @returns {string[]}
 */
export const findUnknownEnforcers = (registry, knownEnforcers) => {
  const known = new Set(knownEnforcers);
  const errors = [];

  for (const rule of registry.rules) {
    for (const enforcer of rule.enforcedBy ?? []) {
      if (!known.has(enforcer)) {
        errors.push(`agent-rules.json: rule "${rule.id}" cites unknown enforcer "${enforcer}"`);
      }
    }
  }

  return errors;
};

/**
 * Every rule's anchor must be present in the text an agent loads without being asked.
 *
 * @param {{ rules: Array<{ id: string, anchor: string }> }} registry
 * @param {string} alwaysLoadedText concatenated contents of the always-loaded files
 * @returns {string[]}
 */
export const findMissingAnchors = (registry, alwaysLoadedText) => {
  const haystack = normalizeWhitespace(alwaysLoadedText);

  return registry.rules
    .filter((rule) => !haystack.includes(normalizeWhitespace(rule.anchor)))
    .map(
      (rule) =>
        `agent-rules.json: rule "${rule.id}" is no longer in the always-loaded instructions ` +
        `(anchor "${rule.anchor}" not found). Restore the rule, or change the registry on purpose.`,
    );
};

/**
 * Claude Code loads CLAUDE.md; the shared rule body reaches it only through the import line.
 *
 * @param {string} claudeMd
 * @param {string | undefined} importLine for example "@AGENTS.md"
 * @returns {string[]}
 */
export const checkClaudeImport = (claudeMd, importLine) => {
  if (!isNonEmptyString(importLine)) {
    return [];
  }

  const imported = claudeMd.split(/\r?\n/).some((line) => line.split(/\s+/).includes(importLine));

  return imported
    ? []
    : [`CLAUDE.md: expected to import the shared rules with "${importLine}" (agent-rules.json)`];
};
