import { access, readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();

/**
 * Byte size budget for CLAUDE.md.
 *
 * CLAUDE.md is loaded in full at session startup before any code is read,
 * imposing a permanent token tax on every turn. The file must grow deliberately
 * rather than accumulate ad-hoc content. Move empirical evidence, benchmarks,
 * and measurement details to docs/tooling-evidence.md instead of expanding this budget.
 */
const CLAUDE_MD_MAX_BYTES = 18_500;

const aiGuidePath = join(root, 'AI_GUIDE.md');
const readmePath = join(root, 'README.md');
const claudeMdPath = join(root, 'CLAUDE.md');

const [aiGuide, readme, claudeMdBuffer] = await Promise.all([
  readFile(aiGuidePath, 'utf-8'),
  readFile(readmePath, 'utf-8'),
  readFile(claudeMdPath),
]);

const requiredAiGuideTokens = [
  '## AI Agent Operating Mode (Local Development)',
  '## Search Mode (Exhaustive, For Non-Trivial Tasks)',
  '## Refactor Debt Prevention (Always-On)',
  '## Local Verification Entry Points',
  'npm run verify:local',
  'npm run verify:template',
];

const requiredReadmeTokens = ['Use `AI_GUIDE.md` as the source of truth for implementation rules.'];

const errors = [];
if (claudeMdBuffer.length > CLAUDE_MD_MAX_BYTES) {
  errors.push(
    `CLAUDE.md: size ${claudeMdBuffer.length} bytes exceeds budget of ${CLAUDE_MD_MAX_BYTES} bytes. Move empirical evidence and measurements to docs/tooling-evidence.md instead of expanding the budget.`,
  );
}

for (const token of requiredAiGuideTokens) {
  if (!aiGuide.includes(token)) {
    errors.push(`AI_GUIDE.md: expected to include "${token}"`);
  }
}

for (const token of requiredReadmeTokens) {
  if (!readme.includes(token)) {
    errors.push(`README.md: expected to include "${token}"`);
  }
}

// Paths the documents point at must exist. Documentation that names a file which was renamed or
// deleted is worse than no documentation: an agent follows it and reasons about the wrong tree.
const REPO_ROOTED =
  /^(?:client|server|scripts|docs|template|prisma)\/|^\.(?:github|claude|devcontainer|husky)\//;
const PATH_PATTERN = /`([^`\s]+\.(?:md|json|ts|tsx|mjs|cjs|js|yml|yaml|py|sh|css|prisma))`/g;

/**
 * Sections explicitly marked illustrative describe a hypothetical feature, so the files they name
 * are not supposed to exist.
 */
const withoutIllustrativeSections = (markdown) => {
  const lines = markdown.split(/\r?\n/);
  const kept = [];
  let skipping = false;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      skipping = line.includes('(Illustrative)');
    }
    if (!skipping) {
      kept.push(line);
    }
  }

  return kept.join('\n');
};

const collectPaths = (markdown) => {
  const found = new Set();

  for (const [, candidate] of withoutIllustrativeSections(markdown).matchAll(PATH_PATTERN)) {
    // Globs such as `scripts/verify-*.mjs` name a family, not a file.
    if (REPO_ROOTED.test(candidate) && !candidate.includes('*')) {
      found.add(candidate);
    }
  }

  return [...found];
};

const exists = async (relativePath) => {
  try {
    await access(join(root, relativePath));
    return true;
  } catch {
    return false;
  }
};

/**
 * Build artifacts are legitimately named by the documentation but are absent from a clean
 * checkout, and this check runs before the pipeline generates them. Anything git ignores is
 * an artifact by definition, so its absence says nothing about the documentation being stale.
 */
const gitIgnored = (paths) => {
  if (paths.length === 0) return new Set();

  const result = spawnSync('git', ['check-ignore', '--stdin'], {
    cwd: root,
    input: `${paths.join('\n')}\n`,
    encoding: 'utf8',
  });

  // Exit code 1 simply means nothing matched; anything else means git could not answer,
  // and we would rather check every path than silently skip them all.
  if (result.error || (result.status !== 0 && result.status !== 1)) {
    return new Set();
  }

  return new Set(
    result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  );
};

/** Every markdown file under `base`, skipping the directory names in `skipDirs`. */
const markdownFilesIn = async (base, skipDirs = []) => {
  const skip = new Set(skipDirs);
  const found = [];

  const walk = async (dir, relative) => {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const nextRelative = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (!skip.has(nextRelative)) await walk(join(dir, entry.name), nextRelative);
      } else if (entry.name.endsWith('.md')) {
        found.push([`${base}/${nextRelative}`, await readFile(join(dir, entry.name), 'utf-8')]);
      }
    }
  };

  await walk(join(root, base), '');
  return found;
};

/**
 * Live documentation is checked alongside the guide. docs/archive/ is exempt on purpose: it
 * records finished work and is expected to name paths the tree no longer has.
 *
 * Serena's memories are checked for the same reason the guide is. They are prose an agent
 * trusts, they are not regenerated from the code, and the last time they went unchecked they
 * ended up pointing at files that had been deleted months earlier.
 */
const proseDocuments = async () => [
  ...(await markdownFilesIn('docs', ['archive'])),
  ...(await markdownFilesIn('.serena/memories')),
];

for (const [label, markdown] of [
  ['AI_GUIDE.md', aiGuide],
  ['README.md', readme],
  ['AGENTS.md', await readFile(join(root, 'AGENTS.md'), 'utf-8')],
  ...(await proseDocuments()),
]) {
  const paths = collectPaths(markdown);
  const ignored = gitIgnored(paths);
  const tracked = paths.filter((path) => !ignored.has(path));
  const checks = await Promise.all(tracked.map(async (path) => [path, await exists(path)]));

  for (const [path, found] of checks) {
    if (!found) {
      errors.push(`${label}: references ${path}, which does not exist`);
    }
  }
}

if (errors.length > 0) {
  console.error('AI guide verification failed.');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('AI guide verification passed.');
