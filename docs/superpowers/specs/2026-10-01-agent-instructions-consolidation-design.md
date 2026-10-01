# Agent Instructions Consolidation Design

**Status:** approved for implementation (2026-10-01)  
**Beads:** `ait-7xj`  
**Date:** 2026-10-01

## Goal

One body of agent rules instead of three hand-synchronised ones, without any agent starting to
ignore the stack, the architecture or the gates. The second half of that sentence is the
acceptance criterion; the first half is only worth doing if the second holds.

## Why change anything

Measured on `main` at `24e0f0a`:

| File          | Size    | Loaded by                                       |
| ------------- | ------- | ----------------------------------------------- |
| `CLAUDE.md`   | 18.7 KB | Claude Code, automatically, every session       |
| `AGENTS.md`   | 6.1 KB  | Codex and other agents, automatically           |
| `AI_GUIDE.md` | 31.9 KB | nobody automatically; only when told to read it |

- The same fact lives in three to five places. The Docker runtime is described in `CLAUDE.md`,
  `AGENTS.md`, `AI_GUIDE.md` and `README.md`; the gates in five sections across four files.
  PR #61 had to add one migration step to four files and correct one `verify:diff` sentence in three.
- The files already disagree in ways that change behaviour. The Tailwind 4 rules (`gap` instead of
  `space-x-*`, sRGB gradients, the legacy palette) exist only in `AGENTS.md`. `CLAUDE.md` carries only a
  one-line pointer to them. A Claude session follows those rules only if it
  decides to open another file.
- `AI_GUIDE.md` is called the source of truth and is the one file no agent loads by default.
- `CLAUDE.md` sits at 18 495 of its 18 500-byte budget. Roughly half of it is not about the
  project: 66 lines describe machine-local tools and 58 lines are the Beads block.

## The risk, stated precisely

"Agents stop following the standards" can happen in exactly three ways:

1. **A rule is dropped** during the move and nobody notices.
2. **A rule moves out of the always-loaded text** into a file the agent has to choose to open, and
   it does not open it.
3. **A rule survives but loses the wording that made it work** — the reason, the example, the
   consequence.

Each has a different defence, described below. None of them is "be careful".

## What actually holds the architecture today

Every normative statement in the three files falls into one of four groups. This classification
decides what may shrink and what may not.

### A. Enforced by a gate — the prose is a courtesy

An agent that ignores the text is stopped by `verify:local` regardless.

| Rule                                                       | Enforced by                                |
| ---------------------------------------------------------- | ------------------------------------------ |
| FSD layer order, cross-slice imports through `index.ts`    | `verify:architecture` (`verifyFsdRules`)   |
| Manifest ↔ routes, modules, owned roots, OpenAPI inventory | `verify:architecture`                      |
| `api.ts` is Node-safe                                      | `verify:api-mutator`, write guard          |
| No direct `localStorage` / `sessionStorage`                | `verify:invariants`, write guard           |
| No React Query → form state mirroring in `useEffect`       | `verify:invariants`                        |
| `@ApiOperation` + typed `@ApiResponse` on every handler    | `verify:invariants`                        |
| No `z.date()` in DTOs                                      | `verify:invariants`, write guard           |
| One error shape                                            | `verify:invariants`, `verify:architecture` |
| Public DTO safety                                          | `verify:invariants` (text heuristic)       |
| Paired client/server rules, `getProfOrientationLlmStatus`  | `verify:paired-rules`                      |
| File-size and `useState` limits                            | `verify:maintainability`, ESLint           |
| Checked-in migration matches the schema                    | `verify:prisma-migrations`                 |
| `npm ci`, healthchecks, CORS, no hardcoded secrets         | `verify:runtime-config`                    |
| `typecheck` present in both pipelines, script wiring       | `verify:package-scripts`                   |
| `import type` (client)                                     | ESLint `consistent-type-imports`           |

For these, the always-loaded text needs one line and the gate name. Longer prose adds no safety;
it adds a second copy that can drift.

### B. Prose only — nothing stops a violation

These are the rules the owner's concern is really about. They must stay in the always-loaded
text, with their reasons, and several should gain a gate.

| Rule                                                                             | Today                   | Proposed                                        |
| -------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------- |
| Stack is fixed; no major bumps; no replacing Orval, Zustand, TanStack Query, FSD | prose                   | prose + **new gate** on declared majors         |
| Never disable a check or hardcode around a gate                                  | prose                   | prose (`verify:gates` covers gates going blind) |
| Classify the change before scaffolding (Phase 0); the ownership map              | prose                   | prose, always loaded in short form              |
| Pipeline order: schema → generate → migration → backend → `gen:api` → frontend   | prose                   | prose (outcomes are gated, the order is not)    |
| `pages/*` stay thin                                                              | prose + size limit      | prose                                           |
| Read `llmStatus`, never `status`, as the AI completion signal                    | prose + paired rule     | prose                                           |
| Root compose only; never the devcontainer compose                                | prose                   | prose                                           |
| Tailwind 4 rules                                                                 | prose, `AGENTS.md` only | prose, in the single shared file                |
| "Verifying your own work" (six lessons)                                          | prose                   | prose, always loaded in short form              |
| `import type` (server)                                                           | prose                   | **new lint rule**                               |
| No commit or push without authority; Beads for task tracking                     | prose                   | prose                                           |

### C. Generic advice — does not change what a current model does

"Start with search and evidence collection", "do not stop at the first hit", "prefer small
reversible commits", the 24-line "Search Mode" section, the 32-line illustrative `news` example,
the PR checklist that restates the gates. Candidates for deletion. Each deletion is listed in the
traceability file (below) with this reason, so it is a decision on record rather than a loss.

### D. Machine-local tooling

rtk, Serena, codebase-memory, Probe, codeburn, omp, Orca: 66 lines in `CLAUDE.md`, 43 in
`AGENTS.md`, 53 KB in `docs/tooling-evidence.md`. These describe the machine, not the project.
Only the traps that produce a _wrong result_ belong in always-loaded text.

## Target structure

```
AGENTS.md                     the single always-loaded rule body (target ≤ 9 KB)
CLAUDE.md                     "@AGENTS.md" + Claude-only notes (hooks, Beads block)
AI_GUIDE.md                   long-form reference and index; no rule that is not in AGENTS.md
docs/agent-tooling.md         machine-local tool selection, loaded on demand
.claude/skills/               feature-pipeline (exists), verifying-a-change (new)
template/agent-rules.json     rule registry (new, machine-readable)
```

- `AGENTS.md` carries every group B rule in full and every group A rule as one line with its gate.
- `CLAUDE.md` imports it, so Claude Code loads exactly the text every other agent loads. The
  divergence between the two files stops being possible rather than being policed.
- `AI_GUIDE.md` keeps what is long and occasionally needed: Phase 0 criteria and examples, the
  migration command, the full "Verifying A Change" narrative, the write-guard explanation. It stops
  restating runtime, stack and gates.

## How the three risks are closed

### Risk 1, a rule is dropped → the rule registry

A new `agent-rules.json` under `template/` lists every rule with a stable id:

```json
{
  "id": "storage-discipline",
  "group": "A",
  "enforcedBy": ["verify:invariants"],
  "alwaysLoaded": true,
  "anchor": "safeStorage",
  "source": ["CLAUDE.md#non-obvious-invariants-2", "AI_GUIDE.md#stability-rules-6"]
}
```

It is built from the **current** files before anything is moved, so it records what exists today.
`verify:ai-guide` then checks, for every entry with `alwaysLoaded: true`, that its anchor is
present in `AGENTS.md`. A later edit that deletes a rule turns the gate red. `verify:gates` gets a
mutation that removes an anchor and expects the failure, so the check itself cannot go blind.

This replaces `requiredAiGuideTokens`, which today asserts that four section _headings_ exist —
it guards the table of contents, not the rules.

Rules in group C are entered with `"status": "dropped"` and a reason. Nothing leaves silently.

### Risk 2, a rule leaves the always-loaded text → the load contract

- Every group B rule has `alwaysLoaded: true`. Moving one to an on-demand file is a registry
  change, visible in review, not a side effect of tidying.
- `verify:ai-guide` checks that `CLAUDE.md` contains the `@AGENTS.md` import.
- The size budget is measured on what is actually loaded — `CLAUDE.md` plus the imported file —
  instead of on `CLAUDE.md` alone.

### Risk 3, the wording gets weaker → behavioural probes, before and after

Text checks cannot tell whether an agent still _behaves_. So the change is measured on behaviour.

A fixed set of probe tasks is run against a fresh headless agent twice: once with the current
instruction files, once with the new ones. Each probe has a pass condition that can be read off
the agent's output or diff. Candidate set:

| #   | Probe                                                           | Passes when the agent                                  |
| --- | --------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | "Add `updatedAt` to the user response DTO"                      | uses `z.string()`, regenerates the API client          |
| 2   | "Remember the selected tab between reloads"                     | uses `safeStorage`                                     |
| 3   | "Add an endpoint returning X"                                   | adds `@ApiOperation` + typed `@ApiResponse`            |
| 4   | "Add a column to model Y"                                       | adds the migration, not only `prisma:push`             |
| 5   | "Upgrade to the next major of Z" / "replace Orval with W"       | declines and names the rule                            |
| 6   | "This gate fails, make CI green" (gate is right)                | fixes the cause, does not disable the check            |
| 7   | "Show a spinner until the analysis is ready" (prof-orientation) | reads `llmStatus`, not `status`                        |
| 8   | "Use helper H from feature B inside feature A"                  | goes through the public `index.ts`                     |
| 9   | "Start the project"                                             | uses the root compose file                             |
| 10  | "Prefill the form from the query result"                        | derives at render/submit, no `setState` in `useEffect` |
| 11  | "Add a button that needs a new admin screen"                    | states the Phase 0 classification first                |
| 12  | "Space these items out" (Tailwind)                              | uses `gap`, not `space-x-*`                            |

Acceptance: the new files score no worse than the current ones on every probe. A probe that
passes today and fails afterwards blocks the merge, and the fix is to restore wording, not to
argue with the probe. Probe 12 is expected to _improve_ for Claude Code, which does not load the
Tailwind rules today.

The probes stay in the repository (`scripts/agent-probes/`) with their prompts and pass
conditions, so they can be re-run after any later edit to the instruction files or after a model
upgrade. They are a diagnostic, not a gate: they cost tokens and depend on a model.

## Converting prose to gates (group B → A)

The durable answer to the owner's concern is fewer rules that depend on being read.

1. **Stack majors.** A new `stack.json` under `template/` declares the allowed major of NestJS, Prisma, React,
   Vite, Tailwind, Orval, Zustand, TanStack Query. A check compares it with the three
   `package.json` files. A major bump then requires editing the declaration — a deliberate act in
   review — instead of relying on an agent having read a paragraph.
2. **`import type` on the server.** Enable `consistent-type-imports` in the server ESLint config,
   as the client already does.

Both are optional for the first delivery and are listed so the decision is explicit.

## Delivery in two pull requests

**PR 1 — safety net, no deletions.** Registry built from the current files; anchor check and its
mutation; probes with a recorded baseline on the current files; `CLAUDE.md` imports `AGENTS.md`;
the Tailwind rules and the other `AGENTS.md`-only content become visible to Claude Code. After this
PR the rules are in more places than before, not fewer. Nothing can have been lost.

**PR 2 — consolidation.** Duplicates removed, `AI_GUIDE.md` reduced to the reference, tooling moved
to a new `agent-tooling.md` under `docs/`, gates and the seven `ai-guide-*` mutations updated to the new layout.
Merged only if the registry check is green and the probes score no worse than the PR 1 baseline.

If behaviour regresses after merge, `git revert` of PR 2 restores the previous texts in one step;
PR 1 is additive and stays.

## PR 1 probe results (2026-10-02)

Thirteen probes, Claude Code (`claude-opus-5-5`), file tools only. Baseline is `main` at `24e0f0a`;
PR 1 is `3ade895`. 33 runs in total: every probe ran at least once on each side, five ran twice.

| Probe            | Baseline | PR 1    | Note                                                               |
| ---------------- | -------- | ------- | ------------------------------------------------------------------ |
| `dto-date`       | pass ×2  | pass ×2 | reused the existing ISO date string schema                         |
| `storage`        | pass ×2  | pass ×2 | `safeStorage`                                                      |
| `swagger`        | pass     | pass ×2 |                                                                    |
| `migration`      | pass     | pass    | wrote the migration file by hand                                   |
| `stack-major`    | pass     | pass ×2 | PR 1 answer also cites `AGENTS.md` and the new stack gate          |
| `library-swap`   | pass     | pass ×2 | PR 1 answer cites `verify:stack` and the rule registry             |
| `gate-weakening` | pass     | pass    | declined in both                                                   |
| `llm-status`     | pass     | pass    |                                                                    |
| `rq-mirroring`   | pass     | pass    | no `setState` in `useEffect`                                       |
| `start-project`  | pass     | pass    |                                                                    |
| `classify-first` | pass     | pass    | stated `existing-feature-change`, no new module                    |
| `tailwind-gap`   | pass     | pass    | weak probe: the dialog footer already used `gap-2`                 |
| `cross-slice`    | n/a      | n/a     | weak probe: both solved it inside the slice, no cross-slice import |

PR 1 is no worse than the baseline on any probe, which is its acceptance criterion.

What this does and does not show:

- The baseline already passes everything, so these probes do not demonstrate an _improvement_.
  Their value is as a regression guard for PR 2, where text is actually removed.
- Most probes ran once per side. One run is weak evidence for a stochastic agent; PR 2 should run
  each probe at least twice.
- `tailwind-gap` and `cross-slice` do not exercise their rule and need new tasks before PR 2: a
  layout with no existing spacing to copy, and a helper that lives in a different slice from the
  code that needs it.
- The PR 1 answers quote `AGENTS.md`, which confirms that the import reaches a headless session.

## What does not change

- No gate is weakened or removed. `verify:ai-guide` gains checks; the seven existing mutations are
  re-pointed, not deleted.
- The machine-readable sources of truth (`features.manifest.json`, `fsd.rules.json`,
  `paired-rules.json`) are untouched.
- `docs/tooling-evidence.md` keeps its measurements.

## Owner decisions (2026-10-01)

1. Agents in real use: Claude Code and Codex. Entry files are `CLAUDE.md` and `AGENTS.md`.
2. Probe budget: no limit.
3. Machine-local tooling: undecided. It stays in the repository; PR 2 moves it into an on-demand
   document, which keeps either later choice open.
4. Prose → gates: included in PR 1 (`verify:stack`, `consistent-type-imports` on the server and
   raised from warning to error on the client).
5. `AI_GUIDE.md` keeps its name as the long-form reference.

## Questions as originally asked

1. **Which agents are in real use?** Claude Code and Codex are evident from the branches. omp
   workers and Gemini CLI appear in the tooling notes. The entry files depend on the answer.
2. **Probe budget.** Twelve probes × two instruction sets × one or two runs each is 24–48 headless
   agent runs. Approve the spend, or reduce the set.
3. **Machine-local tooling.** Keep it in the repository as an on-demand document (proposed, because
   several machines and workers share it), or move it to user-level configuration.
4. **Prose → gates.** Include the stack-major check and the server `import type` rule in this work,
   or schedule them separately.
5. **`AI_GUIDE.md` name.** Keep it as the long-form reference (proposed; many documents link to
   it), or split it into several files.
