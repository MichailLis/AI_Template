/**
 * Pure logic behind `npm run verify:stack`.
 *
 * The stack is fixed on purpose, and until this check that was a sentence in the instruction
 * files: an agent that had not read it, or had talked itself past it, could bump a major or drop a
 * library and nothing failed. `template/stack.json` declares the allowed major of each load-bearing
 * package; a major bump now needs an edit to that declaration, which is a decision visible in
 * review rather than a side effect of `npm install`.
 *
 * No I/O here: the caller supplies the declaration and the parsed manifests.
 */

/**
 * First integer of a semver range: "^8.3.1" -> 8, "~6.0.3" -> 6, "4.3.3" -> 4, ">=19 <20" -> 19.
 * Returns null for anything without a leading version number ("workspace:*", "latest", a URL),
 * because a range this check cannot read must not pass as "no major to compare".
 *
 * @param {unknown} range
 * @returns {number | null}
 */
export const parseMajor = (range) => {
  if (typeof range !== 'string') {
    return null;
  }

  const match = /^\s*(?:[\^~]|>=?|<=?|=|v)?\s*(\d+)(?:\.|\s|$|-)/.exec(range);

  return match ? Number(match[1]) : null;
};

/**
 * @param {unknown} declaration parsed template/stack.json
 * @returns {string[]}
 */
export const validateStackDeclaration = (declaration) => {
  if (
    typeof declaration !== 'object' ||
    declaration === null ||
    !Array.isArray(declaration.packages) ||
    declaration.packages.length === 0
  ) {
    return ['stack.json: expected a non-empty "packages" array'];
  }

  const errors = [];

  for (const [index, entry] of declaration.packages.entries()) {
    const label = typeof entry?.name === 'string' ? `"${entry.name}"` : `entry #${index + 1}`;

    if (typeof entry?.name !== 'string' || entry.name.trim() === '') {
      errors.push(`stack.json: ${label} has no package name`);
    }
    if (typeof entry?.manifest !== 'string' || entry.manifest.trim() === '') {
      errors.push(`stack.json: ${label} must name the package.json that declares it`);
    }
    if (!Number.isInteger(entry?.major) || entry.major < 0) {
      errors.push(`stack.json: ${label} must declare an integer "major"`);
    }
  }

  return errors;
};

/**
 * Compares the declared majors with what the manifests ask for.
 *
 * A package missing from its manifest is an error, not a skip: removing Orval or Zustand is the
 * library replacement the stack rule forbids.
 *
 * @param {{ packages: Array<{ name: string, manifest: string, major: number }> }} declaration
 * @param {Record<string, { dependencies?: Record<string, string>, devDependencies?: Record<string, string> } | null>} manifests
 *   parsed package.json contents keyed by the path used in the declaration
 * @returns {string[]}
 */
export const checkStack = (declaration, manifests) => {
  const errors = [];

  for (const { name, manifest, major } of declaration.packages) {
    const parsed = manifests[manifest];

    if (!parsed) {
      errors.push(`${manifest}: could not be read (declared for "${name}" in stack.json)`);
      continue;
    }

    const range = parsed.dependencies?.[name] ?? parsed.devDependencies?.[name];

    if (range === undefined) {
      errors.push(
        `${manifest}: "${name}" is part of the fixed stack and is no longer a dependency. ` +
          'Replacing a stack library needs an explicit decision recorded in template/stack.json.',
      );
      continue;
    }

    const actual = parseMajor(range);

    if (actual === null) {
      errors.push(`${manifest}: cannot read a major version from "${name}": "${range}"`);
    } else if (actual !== major) {
      errors.push(
        `${manifest}: "${name}" is at major ${actual} ("${range}") but the stack is fixed at ` +
          `major ${major}. A major bump is a separately approved migration: change ` +
          'template/stack.json in the same change that carries the migration.',
      );
    }
  }

  return errors;
};
