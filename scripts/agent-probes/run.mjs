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
 * The compose project name and container names are fixed globally, so a probe that ran
 * `docker compose` from a worktree would hit the live stack. Claude Code therefore gets file tools
 * only. Codex cannot edit without its shell sandbox, so it runs in `workspace-write` (no network)
 * and is told in a fixed preamble to leave containers and databases alone.
 *
 * Usage:
 *   node scripts/agent-probes/run.mjs --ref <git-ref> --label <name> --out <dir>
 *        [--agent claude|codex|codex-orca] [--only id,id] [--runs 2] [--concurrency 4] [--timeout-ms 900000]
 */

const rootDir = process.cwd();

const readArgs = (argv) => {
  const args = { agent: 'claude', runs: 1, concurrency: 4, timeoutMs: 900_000, only: null };

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
      case '--agent':
        args.agent = value;
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

  if (!args.ref || !args.label || !args.out || !AGENTS[args.agent]) {
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

const CODEX_LAST_MESSAGE_FILE = '.agent-probe-last-message.txt';

const parseClaudeOutput = (stdout) => {
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

/**
 * Each command is one string of fixed literals: on Windows both CLIs are .cmd shims and need a
 * shell, and nothing user-supplied is concatenated in. The prompt always travels through stdin.
 */
const AGENTS = {
  claude: {
    command:
      'claude -p --output-format json --permission-mode acceptEdits ' +
      '--allowedTools Read,Edit,Write,Glob,Grep --no-session-persistence',
    preamble: '',
    parse: ({ stdout }) => parseClaudeOutput(stdout),
  },
  codex: {
    command:
      'codex exec --skip-git-repo-check -s workspace-write ' + `-o ${CODEX_LAST_MESSAGE_FILE} -`,
    preamble:
      'Harness note: this is an isolated copy of the repository. Do not start, stop or modify ' +
      'Docker containers or databases, and do not install dependencies.\n\n',
    parse: ({ stdout, cwd }) => {
      const lastMessagePath = join(cwd, CODEX_LAST_MESSAGE_FILE);
      const answer = existsSync(lastMessagePath) ? readFileSync(lastMessagePath, 'utf8') : stdout;
      rmSync(lastMessagePath, { force: true });

      return { answer, turns: null, costUsd: null, models: [] };
    },
  },
  'codex-orca': {
    run: (options) => runCodexThroughOrca(options),
    parse: ({ result }) => ({ answer: result.answer, turns: null, costUsd: null, models: [] }),
  },
};

const ORCA_ANSWER_FILE = '.agent-probe-answer.md';

const orca = (orcaArgs, timeoutMs = 120_000) => {
  const result = spawnSync('orca', [...orcaArgs, '--json'], {
    encoding: 'utf8',
    shell: true,
    timeout: timeoutMs,
    maxBuffer: 16 * 1024 * 1024,
  });

  try {
    const parsed = JSON.parse(result.stdout);

    return parsed.ok ? parsed.result : { error: JSON.stringify(parsed).slice(0, 400) };
  } catch {
    return { error: result.error?.message ?? `orca ${orcaArgs[0]} ${orcaArgs[1]}: no JSON output` };
  }
};

/**
 * Codex through an Orca terminal: a fresh interactive session per probe, rooted in the worktree.
 *
 * `codex exec` is the simpler route and stays available as `--agent codex`, but an account can
 * reject the configured model for non-interactive use while accepting it in the TUI. This driver
 * starts the TUI in its own Orca tab, sends the task, waits for it to go idle and closes the tab.
 * It never touches a terminal it did not create.
 *
 * The TUI's screen is not a reliable transcript, so the task asks Codex to write its final reply
 * into a file, which is read and removed before the diff is taken.
 */
const runCodexThroughOrca = async ({ cwd, prompt, timeoutMs }) => {
  const worktreePath = cwd.replace(/\\/g, '/');
  const created = orca([
    'terminal',
    'create',
    '--worktree',
    'active',
    '--title',
    '"agent-probe"',
    '--command',
    `"codex -C ${worktreePath} -s workspace-write -a never"`,
  ]);
  const handle = created.terminal?.handle;

  if (!handle) {
    return { ok: false, error: `orca terminal create failed: ${created.error}`, answer: '' };
  }

  try {
    const ready = orca([
      'terminal',
      'wait',
      '--terminal',
      handle,
      '--for',
      'tui-idle',
      '--timeout-ms',
      '90000',
    ]);

    // A prompt typed into a TUI that is still starting is lost, so an unready terminal is a
    // failed run rather than a probe the agent "did not answer".
    if (!ready.wait?.satisfied) {
      return { ok: false, error: 'codex TUI did not become ready', answer: '' };
    }

    const task =
      'Harness note: this is an isolated copy of the repository. Do not start, stop or modify ' +
      'Docker containers or databases, and do not install dependencies. When you are done, also ' +
      `write your final reply verbatim into the file ${ORCA_ANSWER_FILE} at the repository root. ` +
      `Task: ${prompt.replace(/\s+/g, ' ')}`;
    // The text is one shell argument; double quotes are the only character that could end it.
    const sent = orca([
      'terminal',
      'send',
      '--terminal',
      handle,
      '--text',
      `"${task.replace(/"/g, "'")}"`,
      '--enter',
    ]);

    if (!sent.send?.accepted) {
      return { ok: false, error: `orca terminal send failed: ${sent.error}`, answer: '' };
    }

    // Give the TUI a moment to leave the idle state before waiting for it to return there.
    await new Promise((resolveSleep) => setTimeout(resolveSleep, 20_000));

    const answerPath = join(cwd, ORCA_ANSWER_FILE);
    const deadline = Date.now() + timeoutMs;
    let idle = false;

    // Idle with no answer file means Codex paused between steps, not that it finished.
    while (Date.now() < deadline) {
      const waited = orca(
        ['terminal', 'wait', '--terminal', handle, '--for', 'tui-idle', '--timeout-ms', '120000'],
        150_000,
      );
      idle = Boolean(waited.wait?.satisfied);

      if (idle && existsSync(answerPath)) {
        break;
      }
    }

    const answer = existsSync(answerPath) ? readFileSync(answerPath, 'utf8') : '';
    rmSync(answerPath, { force: true });

    return answer
      ? { ok: true, error: null, answer }
      : { ok: false, error: idle ? 'no answer file written' : 'timed out', answer: '' };
  } finally {
    orca(['terminal', 'close', '--terminal', handle]);
    // The TUI holds the worktree open for a moment after its tab closes.
    await new Promise((resolveSleep) => setTimeout(resolveSleep, 3_000));
  }
};

/** Runs one headless agent in `cwd` and resolves with its stdout, or with the reason it failed. */
const runAgent = ({ agent, cwd, prompt, timeoutMs }) =>
  agent.run
    ? agent.run({ cwd, prompt, timeoutMs })
    : runAgentCommand({ agent, cwd, prompt, timeoutMs });

const runAgentCommand = ({ agent, cwd, prompt, timeoutMs }) =>
  new Promise((resolvePromise) => {
    const child = spawn(agent.command, { cwd, shell: true, stdio: ['pipe', 'pipe', 'pipe'] });

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
    child.stdin.end(agent.preamble + prompt);
  });

const runProbe = async ({ probe, run, commit, args }) => {
  const worktree = mkdtempSync(join(tmpdir(), `agent-probe-${probe.id}-`));
  const agent = AGENTS[args.agent];
  const record = {
    probe: probe.id,
    rule: probe.rule,
    agent: args.agent,
    label: args.label,
    commit,
    run,
  };

  try {
    git(['worktree', 'add', '--detach', '--force', worktree, commit]);

    const result = await runAgent({
      agent,
      cwd: worktree,
      prompt: probe.prompt,
      timeoutMs: args.timeoutMs,
    });

    // Read the agent's own output first: for Codex that also removes its last-message file, which
    // must not show up in the diff as something the agent changed.
    const output = agent.parse({ stdout: result.stdout, cwd: worktree, result });

    // Untracked files are part of what the agent did; `git diff` alone would hide a new migration.
    git(['add', '-A'], worktree);
    const diff = git(['diff', '--cached', '--no-color'], worktree);
    const files = git(['diff', '--cached', '--name-status'], worktree).trim();

    Object.assign(record, output, {
      ok: result.ok,
      error: result.error,
      stderr: (result.stderr ?? '').slice(-2000),
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
