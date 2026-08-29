import { access, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();

const aiGuidePath = join(root, 'AI_GUIDE.md');
const readmePath = join(root, 'README.md');

const [aiGuide, readme] = await Promise.all([
  readFile(aiGuidePath, 'utf-8'),
  readFile(readmePath, 'utf-8'),
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
  /^(?:client|server|scripts|docs|template|prisma)\/|^\.(?:github|claude|codex|devcontainer|husky)\//;
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
 * Live documentation is checked alongside the guide. docs/archive/ is exempt on purpose: it
 * records finished work and is expected to name paths the tree no longer has.
 */
const liveDocs = async () => {
  const docsRoot = join(root, 'docs');
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
        if (nextRelative !== 'archive') await walk(join(dir, entry.name), nextRelative);
      } else if (entry.name.endsWith('.md')) {
        found.push([`docs/${nextRelative}`, await readFile(join(dir, entry.name), 'utf-8')]);
      }
    }
  };

  await walk(docsRoot, '');
  return found;
};

for (const [label, markdown] of [
  ['AI_GUIDE.md', aiGuide],
  ['README.md', readme],
  ['AGENTS.md', await readFile(join(root, 'AGENTS.md'), 'utf-8')],
  ...(await liveDocs()),
]) {
  const paths = collectPaths(markdown);
  const checks = await Promise.all(paths.map(async (path) => [path, await exists(path)]));

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
