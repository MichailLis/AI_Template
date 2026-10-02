import { access, readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import {
  checkClaudeImport,
  findMissingAnchors,
  findUnknownEnforcers,
  validateRegistry,
} from './lib/agent-rules.mjs';

const root = process.cwd();

/**
 * Byte size budget for the always-loaded instructions.
 *
 * Claude Code loads CLAUDE.md and, through its import, AGENTS.md in full at session startup,
 * before any code is read: a permanent token tax on every turn and every subagent. Codex loads
 * AGENTS.md alone. The budget is measured on both files together, because that is what a session
 * actually pays for. The text must grow deliberately rather than accumulate ad-hoc content: tool
 * notes belong in docs/agent-tooling.md, measurements in docs/tooling-evidence.md, long-form
 * procedure in AI_GUIDE.md.
 */
const ALWAYS_LOADED_MAX_BYTES = 14_500;

const aiGuidePath = join(root, 'AI_GUIDE.md');
const readmePath = join(root, 'README.md');
const claudeMdPath = join(root, 'CLAUDE.md');
const agentsMdPath = join(root, 'AGENTS.md');
const rtkFiltersPath = join(root, 'template', 'rtk-filters.json');

const [aiGuide, readme, claudeMdBuffer, agentsMd, rtkFiltersContent] = await Promise.all([
  readFile(aiGuidePath, 'utf-8'),
  readFile(readmePath, 'utf-8'),
  readFile(claudeMdPath),
  readFile(agentsMdPath, 'utf-8'),
  readFile(rtkFiltersPath, 'utf-8'),
]);
const claudeMd = claudeMdBuffer.toString('utf-8');

/**
 * The budget is measured on LF-normalized content, which is what the repository stores.
 *
 * `.gitattributes` has `* text=auto`, so a Windows checkout materializes CLAUDE.md with CRLF and
 * the same commit weighs ~200 bytes more on disk than on Linux. Measuring the raw buffer made the
 * gate pass in CI and fail locally for reasons that have nothing to do with the content.
 */
const lfByteLength = (text) => Buffer.byteLength(text.replace(/\r\n/g, '\n'), 'utf-8');
const alwaysLoadedByteLength = lfByteLength(claudeMd) + lfByteLength(agentsMd);
const rtkFilters = JSON.parse(rtkFiltersContent);
const unsafeRtkFilters = Array.isArray(rtkFilters.unsafe) ? rtkFilters.unsafe : [];
const warningDocuments = new Set(
  Array.isArray(rtkFilters.warningDocuments) ? rtkFilters.warningDocuments : [],
);

// AGENTS.md is the rule body and points into AI_GUIDE.md for the long form. These are the sections
// it points at: renaming one would leave an always-loaded pointer aimed at nothing.
const requiredAiGuideTokens = [
  '## Verifying A Change (Always-On)',
  '## Feature Pipeline (Required Order)',
  '### Phase 0: Feature Ownership Classification',
  '### Phase 1: Data Modeling',
  '## Refactor Debt Prevention (Always-On)',
  '## Local Verification Entry Points',
  'npm run verify:local',
  'npm run verify:template',
];

const requiredReadmeTokens = [
  'Use `AGENTS.md` as the rule body for agents and `AI_GUIDE.md` as its long-form reference.',
];

const errors = [];
if (alwaysLoadedByteLength > ALWAYS_LOADED_MAX_BYTES) {
  errors.push(
    `CLAUDE.md + AGENTS.md: ${alwaysLoadedByteLength} bytes of always-loaded instructions exceed the budget of ${ALWAYS_LOADED_MAX_BYTES} bytes. Move tool notes to docs/agent-tooling.md and long-form procedure to AI_GUIDE.md instead of expanding the budget.`,
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
for (const command of unsafeRtkFilters) {
  if (!agentsMd.includes(command)) {
    errors.push(`AGENTS.md: missing warning for unsafe rtk command "${command}"`);
  }
}

if (!agentsMd.includes('template/rtk-filters.json')) {
  errors.push('AGENTS.md: expected to include reference to "template/rtk-filters.json"');
}

// Rules an agent must see without opening another file. The registry is the list; this check is
// what makes dropping one of them a red gate instead of a silent loss.
const agentRulesPath = join(root, 'template', 'agent-rules.json');
const agentRules = JSON.parse(await readFile(agentRulesPath, 'utf-8'));
const registryErrors = validateRegistry(agentRules);
errors.push(...registryErrors);

if (registryErrors.length === 0) {
  const rootPackage = JSON.parse(await readFile(join(root, 'package.json'), 'utf-8'));
  // Enforcers that are not npm scripts: the PreToolUse write guard and ESLint rules.
  const knownEnforcers = [...Object.keys(rootPackage.scripts ?? {}), 'write-guard', 'eslint'];
  errors.push(...findUnknownEnforcers(agentRules, knownEnforcers));

  const alwaysLoaded = await Promise.all(
    agentRules.alwaysLoadedFiles.map((fileName) => readFile(join(root, fileName), 'utf-8')),
  );
  errors.push(...findMissingAnchors(agentRules, alwaysLoaded.join('\n')));
  errors.push(...checkClaudeImport(claudeMd, agentRules.claudeImport));
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
 * ended up pointing at files that had been deleted months earlier. Skills are checked for the
 * same reason: they are prose an agent trusts and are not regenerated from code.
 */
const proseDocuments = async () => [
  ...(await markdownFilesIn('docs', ['archive'])),
  ...(await markdownFilesIn('.serena/memories')),
  ...(await markdownFilesIn('.claude/skills')),
];

const checkedDocuments = [
  ['AI_GUIDE.md', aiGuide],
  ['README.md', readme],
  ['AGENTS.md', agentsMd],
  ...(await proseDocuments()),
];

for (const [docName, docContent] of [['CLAUDE.md', claudeMd], ...checkedDocuments]) {
  if (warningDocuments.has(docName)) continue;
  for (const command of unsafeRtkFilters) {
    if (docContent.includes(command)) {
      errors.push(`${docName}: references unsafe rtk command "${command}"`);
    }
  }
}

for (const [label, markdown] of checkedDocuments) {
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
