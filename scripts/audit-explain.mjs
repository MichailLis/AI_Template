import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import {
  AuditReportError,
  compareLockfiles,
  diffAuditReports,
  formatFinding,
  lockfilesEquivalent,
  summarizeBySeverity,
} from './lib/audit-diff.mjs';
import { spawnSyncNpm } from './lib/npm-runner.mjs';

/**
 * `npm run audit:explain` — diagnostic, not a gate.
 *
 * `audit:all` queries the live advisory registry, so it can turn red on a tree nobody touched:
 * an advisory published this morning fails a build whose lock file has not moved in weeks. This
 * tool does not weaken that gate and does not replace it. It answers the question that follows a
 * red audit — "which of these findings did my change bring, and which arrived from outside?" —
 * and it exits 0 whatever it finds, because a finding is not this tool's failure.
 *
 * A non-zero exit means an operational failure only: an unusable `--base`, a lock file git could
 * not produce, an audit that did not run. The one thing this tool must never do is report a clean
 * result for an audit that never happened; `CLAUDE.md` names several tools in this repository that
 * do exactly that, and every doubtful path here is written to fail loudly instead.
 */

const rootDir = process.cwd();

const AREAS = [
  { label: 'root', directory: '.', lockfile: 'package-lock.json', manifest: 'package.json' },
  {
    label: 'client',
    directory: 'client',
    lockfile: 'client/package-lock.json',
    manifest: 'client/package.json',
  },
  {
    label: 'server',
    directory: 'server',
    lockfile: 'server/package-lock.json',
    manifest: 'server/package.json',
  },
];

const USAGE = `Usage: npm run audit:explain [-- --base <ref>]

Splits the vulnerabilities npm reports into the ones this branch introduced, the ones it
inherited, and the ones it fixed, for each of the three lock files (root, client, server).

  --base <ref>   Compare against this git reference. Default: origin/main.
  --help         Print this message.

Diagnostic, not a gate: it exits 0 whatever it finds. A non-zero exit means the tool itself
could not complete — no such reference, a lock file git could not read, or an audit that failed.`;

/** An operational failure: the tool could not do its job, as distinct from finding a problem. */
class OperationalError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OperationalError';
  }
}

const parseArgs = () => {
  const args = process.argv.slice(2);
  let base = 'origin/main';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      console.log(USAGE);
      process.exit(0);
    } else if (arg === '--base') {
      if (i + 1 >= args.length || args[i + 1].startsWith('--')) {
        throw new OperationalError('--base requires a git reference argument.');
      }
      base = args[++i];
    } else if (arg.startsWith('--base=')) {
      base = arg.slice('--base='.length);
      if (!base) {
        throw new OperationalError('--base requires a git reference argument.');
      }
    } else {
      throw new OperationalError(`Unknown option: ${arg}\n\n${USAGE}`);
    }
  }

  return { base };
};

const git = (args, options = {}) =>
  spawnSync('git', args, { cwd: rootDir, maxBuffer: 256 * 1024 * 1024, ...options });

/**
 * Resolves `--base` to a commit and refuses anything git cannot name.
 *
 * A reference that does not exist has to stop the run: silently falling back to an empty base
 * would turn every current finding into "introduced by this change", which is the most damaging
 * wrong answer this tool could give.
 */
const resolveBase = (base) => {
  const result = git(['rev-parse', '--verify', '--quiet', `${base}^{commit}`], {
    encoding: 'utf8',
  });

  if (result.error) {
    throw new OperationalError(`Could not run git: ${result.error.message}`);
  }

  const commit = (result.stdout ?? '').trim();

  if (result.status !== 0 || !commit) {
    throw new OperationalError(
      `Base reference "${base}" does not exist in this repository. ` +
        'Fetch it first, or pass an existing ref with --base.',
    );
  }

  return commit;
};

/** Reads a blob at `ref` as raw bytes, so the lock file comparison stays byte-exact. */
const showAtRef = ({ ref, relativePath }) => {
  const result = git(['show', `${ref}:${relativePath}`], { encoding: 'buffer' });

  if (result.error) {
    throw new OperationalError(`Could not run git: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const detail = (result.stderr?.toString('utf8') ?? '').trim();

    throw new OperationalError(
      `git could not read ${relativePath} at ${ref}${detail ? `: ${detail}` : '.'}\n` +
        '  Refusing to treat the base as having no dependencies — that would report every ' +
        'current finding as newly introduced.',
    );
  }

  return result.stdout;
};

/**
 * Runs one audit and hands back its stdout for the parser to judge.
 *
 * The exit status deliberately does not decide anything: `npm audit` exits non-zero whenever it
 * finds a vulnerability, which is the normal case here, and exits non-zero when the registry is
 * unreachable too. Only the shape of the JSON separates the two, so `parseAuditReport` is the
 * authority and this function only reports a failure to start the process at all.
 */
const runAudit = ({ cwd, extraArgs = [], label }) => {
  const result = spawnSyncNpm(['audit', '--json', ...extraArgs], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });

  if (result.error) {
    throw new OperationalError(`Could not run npm audit (${label}): ${result.error.message}`);
  }

  return result.stdout ?? '';
};

/**
 * Audits the base revision of one area in a throwaway directory outside the repository.
 *
 * `--package-lock-only` is what makes this possible: there is no `node_modules` for a commit that
 * is not checked out, and installing one would be both slow and a change to the machine. The
 * directory lives under `os.tmpdir()` so nothing is ever written inside the tree.
 */
const auditBaseRevision = ({ area, base, label }) => {
  const manifest = showAtRef({ ref: base, relativePath: area.manifest });
  const lockfile = showAtRef({ ref: base, relativePath: area.lockfile });
  const workspace = mkdtempSync(join(tmpdir(), 'audit-explain-'));

  try {
    writeFileSync(join(workspace, 'package.json'), manifest);
    writeFileSync(join(workspace, 'package-lock.json'), lockfile);

    return runAudit({ cwd: workspace, extraArgs: ['--package-lock-only'], label });
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
};

const printGroup = ({ title, findings }) => {
  console.log(`  ${title} (${findings.length}):`);

  if (findings.length === 0) {
    console.log('    (none)');
    return;
  }

  for (const finding of findings) {
    console.log(`    ${formatFinding(finding)}`);
  }
};

const describeCounts = (findings) => {
  const summary = summarizeBySeverity(findings);

  return (
    `${summary.total} finding(s) — critical ${summary.critical}, high ${summary.high}, ` +
    `moderate ${summary.moderate}, low ${summary.low}, info ${summary.info}`
  );
};

/** Compares one area against the base and prints the verdict. Returns a one-line summary. */
const explainArea = ({ area, base, baseLabel }) => {
  const currentLockPath = resolve(rootDir, area.lockfile);

  console.log(`\n--- ${area.label} (${area.lockfile}) ---`);

  if (!existsSync(currentLockPath)) {
    throw new OperationalError(
      `${area.lockfile} is missing from the working tree; cannot compare it with ${baseLabel}.`,
    );
  }

  const comparison = compareLockfiles({
    base: showAtRef({ ref: base, relativePath: area.lockfile }),
    current: readFileSync(currentLockPath),
  });

  if (lockfilesEquivalent(comparison)) {
    const qualifier = comparison.identical ? 'byte for byte' : 'apart from line endings';

    console.log(`  Lock file is unchanged since ${baseLabel}, ${qualifier}.`);
    console.log(
      '  The dependency tree is therefore identical, so any vulnerability audit:all reports',
    );
    console.log('  here came from the advisory registry, not from this change.');
    console.log('  No audit was run: there is nothing to compare.');

    return {
      summary: `${area.label}: lock file unchanged — every finding is external`,
      audited: false,
    };
  }

  console.log(
    `  Lock file differs from ${baseLabel} ` +
      `(base ${comparison.baseBytes} bytes, current ${comparison.currentBytes} bytes).`,
  );
  console.log('  Running both audits; this queries the registry twice and takes a moment.');

  const result = diffAuditReports({
    baseLabel: `${area.label} base at ${baseLabel}`,
    baseSource: auditBaseRevision({ area, base, label: `${area.label} base at ${baseLabel}` }),
    currentLabel: `${area.label} current`,
    currentSource: runAudit({
      cwd: resolve(rootDir, area.directory),
      label: `${area.label} current`,
    }),
  });

  console.log(`  current: ${describeCounts(result.current)}`);
  console.log(`  base:    ${describeCounts(result.base)}`);

  printGroup({ title: 'Introduced by this change', findings: result.introduced });
  printGroup({ title: 'Already present in the base', findings: result.preexisting });
  printGroup({ title: 'Resolved by this change', findings: result.resolved });

  return {
    summary:
      `${area.label}: ${result.introduced.length} introduced, ` +
      `${result.preexisting.length} pre-existing, ${result.resolved.length} resolved`,
    audited: true,
  };
};

const main = () => {
  const { base } = parseArgs();
  const commit = resolveBase(base);
  // A branch name earns its commit in parentheses; an abbreviated sha the user already typed
  // would only be repeated back at them, so it is left as written.
  const shortCommit = commit.slice(0, 7);
  const baseLabel = commit.startsWith(base) ? base : `${base} (${shortCommit})`;

  console.log('npm run audit:explain — diagnostic, not a gate; audit:all remains the gate.');
  console.log(`Base: ${baseLabel}`);

  const results = AREAS.map((area) => explainArea({ area, base, baseLabel }));

  console.log('\nSummary:');
  for (const { summary } of results) {
    console.log(`  ${summary}`);
  }

  // The note only earns its space where two audits actually ran; on the fast path nothing was
  // compared, so explaining how the two sides differ would be noise.
  if (results.some(({ audited }) => audited)) {
    console.log(
      '\nNote: the current side runs `npm audit`, exactly as audit:all does, while the base side',
    );
    console.log(
      '  runs `npm audit --package-lock-only` because the base commit has no node_modules.',
    );
    console.log('  The two agree whenever node_modules matches the lock file, which is the');
    console.log('  normal state after `npm ci`.');
  }

  process.exit(0);
};

try {
  main();
} catch (error) {
  if (error instanceof OperationalError || error instanceof AuditReportError) {
    console.error(`\naudit:explain failed: ${error.message}`);
    console.error('No conclusion was reached. This is NOT a report of zero vulnerabilities.');
    process.exit(1);
  }

  throw error;
}
