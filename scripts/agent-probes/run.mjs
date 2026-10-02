import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

/**
 * Behavioural probes for the agent instruction files — a diagnostic, not a gate.
 *
 * `verify:ai-guide` can prove that a rule is still written down. It cannot prove that an agent
 * still acts on it. This runner gives a fresh headless agent the tasks in probes.json inside a
 * throwaway git worktree checked out at a chosen ref, and records what it answered and what it
 * changed. Running it at two refs (before and after an edit to CLAUDE.md / AGENTS.md / AI_GUIDE.md)
 * shows whether the edit changed behaviour.
 *
 * It costs tokens and its result depends on the model, so it is absent from verify:local and
 * verify:template. Grading is done by reading the recorded output against each probe's `passWhen`.
 *
 * The agent gets file tools only (no shell): the compose project name and container names are
 * fixed globally, so a probe that ran `docker compose` from a worktree would hit the live stack.
 *
 * Usage:
 *   node scripts/agent-probes/run.mjs --ref <git-ref> --label <name> --out <dir>
 *        [--only id,id] [--runs 2] [--concurrency 4] [--timeout-ms 900000]
 */

const rootDir = process.cwd();

const readArgs = (argv) => {
  const args = { runs: 1, concurrency: 4, timeoutMs: 900_000, only: null };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index + 1];

    switch (argv[index]) {
      case '--ref':
        args.ref = value;
        break;
      case '--label':
        args.label = value;
        break;
      case '--out':
        args.out = value;
        break;
      case '--only':
        args.only = new Set(value.split(','));
        break;
      case '--runs':
        args.runs = Number(value);
        break;
      case '--concurrency':
        args.concurrency = Number(value);
        break;
      case '--timeout-ms':
        args.timeoutMs = Number(value);
        break;
      default:
        continue;
    }

    index += 1;
  }

  if (!args.ref || !args.label || !args.out) {
    console.error(
      'Usage: run.mjs --ref <git-ref> --label <name> --out <dir> [--only ids] [--runs N]',
    );
    process.exit(2);
  }

  return args;
};

const git = (gitArgs, cwd = rootDir) => {
  const result = spawnSync('git', gitArgs, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

  if (result.error || result.status !== 0) {
    throw new Error(`git ${gitArgs.join(' ')} failed: ${result.error?.message ?? result.stderr}`);
  }

  return result.stdout;
};

/** Runs one headless agent in `cwd` and resolves with its stdout, or with the reason it failed. */
const runAgent = ({ cwd, prompt, timeoutMs }) =>
  new Promise((resolvePromise) => {
    // One command string: on Windows `claude` is a .cmd shim and needs a shell, and every argument
    // here is a fixed literal, so nothing user-supplied is ever concatenated into it.
    const child = spawn(
      'claude -p --output-format json --permission-mode acceptEdits ' +
        '--allowedTools Read,Edit,Write,Glob,Grep --no-session-persistence',
      { cwd, shell: true, stdio: ['pipe', 'pipe', 'pipe'] },
    );

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill(), timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolvePromise({ ok: false, error: error.message, stdout, stderr });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolvePromise({ ok: code === 0, error: code === 0 ? null : `exit ${code}`, stdout, stderr });
    });

    // The prompt goes through stdin so shell quoting on Windows cannot alter it.
    child.stdin.end(prompt);
  });

const parseAgentOutput = (stdout) => {
  try {
    const parsed = JSON.parse(stdout);

    return {
      answer: typeof parsed.result === 'string' ? parsed.result : stdout,
      turns: parsed.num_turns ?? null,
      costUsd: parsed.total_cost_usd ?? null,
      models: parsed.modelUsage ? Object.keys(parsed.modelUsage) : [],
    };
  } catch {
    return { answer: stdout, turns: null, costUsd: null, models: [] };
  }
};

const runProbe = async ({ probe, run, commit, args }) => {
  const worktree = mkdtempSync(join(tmpdir(), `agent-probe-${probe.id}-`));
  const record = { probe: probe.id, rule: probe.rule, label: args.label, commit, run };

  try {
    git(['worktree', 'add', '--detach', '--force', worktree, commit]);

    const result = await runAgent({
      cwd: worktree,
      prompt: probe.prompt,
      timeoutMs: args.timeoutMs,
    });

    // Untracked files are part of what the agent did; `git diff` alone would hide a new migration.
    git(['add', '-A'], worktree);
    const diff = git(['diff', '--cached', '--no-color'], worktree);
    const files = git(['diff', '--cached', '--name-status'], worktree).trim();

    Object.assign(record, parseAgentOutput(result.stdout), {
      ok: result.ok,
      error: result.error,
      stderr: result.stderr.slice(-2000),
      files,
      diff,
    });
  } catch (error) {
    Object.assign(record, { ok: false, error: error.message });
  }

  // The result is on disk before cleanup starts, so a worktree that cannot be removed costs a
  // leftover directory and never a finished probe.
  writeFileSync(resultPath({ probe, run, args }), `${JSON.stringify(record, null, 2)}\n`);
  console.log(`[${record.ok ? 'done' : 'FAIL'}] ${args.label} ${probe.id} run ${run}`);
  removeWorktree(worktree);

  return record;
};

const resultPath = ({ probe, run, args }) => join(args.outDir, `${probe.id}.run${run}.json`);

/**
 * Best effort. On Windows a process the agent started can keep a handle on the directory for a
 * moment after the agent exits, and `git worktree remove` or `rmSync` then fails with EPERM.
 * Leftovers are reported and cleared by the final `git worktree prune`; they must not end the run.
 */
const removeWorktree = (worktree) => {
  try {
    git(['worktree', 'remove', '--force', worktree]);
    return;
  } catch {
    // Fall through to the filesystem.
  }

  try {
    rmSync(worktree, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
  } catch (error) {
    console.warn(`[warn] could not remove ${worktree}: ${error.code ?? error.message}`);
  }
};

const main = async () => {
  const args = readArgs(process.argv.slice(2));
  const { probes } = JSON.parse(
    readFileSync(join(rootDir, 'scripts', 'agent-probes', 'probes.json'), 'utf8'),
  );
  const commit = git(['rev-parse', '--verify', `${args.ref}^{commit}`]).trim();

  args.outDir = resolve(args.out, args.label);
  mkdirSync(args.outDir, { recursive: true });

  // A recorded result is kept: re-running the same command resumes an interrupted run.
  const queue = probes
    .filter((probe) => !args.only || args.only.has(probe.id))
    .flatMap((probe) =>
      Array.from({ length: args.runs }, (_, index) => ({ probe, run: index + 1, commit, args })),
    )
    .filter((item) => !existsSync(resultPath(item)));

  console.log(
    `${queue.length} probe runs at ${args.ref} (${commit.slice(0, 7)}) -> ${args.outDir}`,
  );

  const workers = Array.from({ length: Math.min(args.concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      await runProbe(queue.shift());
    }
  });

  await Promise.all(workers);
  spawnSync('git', ['worktree', 'prune'], { cwd: rootDir });
};

await main();
