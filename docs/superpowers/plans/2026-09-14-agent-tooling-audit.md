# AI-Agent Tooling Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a measured baseline, fix confirmed AI-tooling reliability hazards, simplify routing, and verify the final state against the same corpus.

**Architecture:** A fixed read-only corpus establishes direct and semantic ground truth before configuration changes. Controlled temporary mutations then test editing, freshness, hooks, wrappers, and gates; only reproduced hazards receive narrow fixes. Beads issue `ait-dwp` is authoritative for status; this document defines execution order.

**Tech Stack:** PowerShell, Node.js, TypeScript Language Server/LSP, Serena MCP, codebase-memory MCP/CLI, ripgrep, RTK, Beads, npm repository gates.

**Spec:** `docs/superpowers/specs/2026-09-14-agent-tooling-audit-design.md`

## Global Constraints

- Work in the current checkout because the user explicitly declined a worktree.
- Baseline commit is `4cc1e05761e312cdf447e9eb61def8ec382e84b8` plus the committed audit design.
- Do not install additional search or MCP tools before baseline evaluation is complete.
- Do not weaken gates, hide failures, or treat negative graph/LSP results as proof of absence.
- Production code must not be changed solely to make a benchmark convenient.
- Temporary mutation artifacts must be removed before final verification.

---

### Task 1: Capture the immutable tooling inventory

**Files:**

- Read: `AI_GUIDE.md`
- Read: `AGENTS.md`
- Read: `CLAUDE.md`
- Read: `docs/tooling-evidence.md`
- Read: `.claude/settings.json`
- Read: `.mcp.json`
- Read: `package.json`
- Read: `template/features.manifest.json`
- Read: `template/fsd.rules.json`
- Modify later: `docs/tooling-evidence.md`

**Interfaces:**

- Consumes: current repository, user-level Claude/Codex/Serena/RTK configuration.
- Produces: versioned inventory with invocation, configuration source, persistence, evidence class, failure modes, and correctness authority.

- [ ] **Step 1: Capture repository and user-level configuration without mutation**

Run direct reads over every source listed above plus `~/.claude/settings.json`, `~/.codex/config.toml`, `~/.serena/serena_config.yml`, and RTK configuration. Redact secrets from recorded output.

- [ ] **Step 2: Capture executable and MCP state**

Run `Get-Command`, `--version`, `codex mcp list`, `codex mcp get`, process inspection, and `npm run doctor:agent-tooling`. Record whether each capability is direct, indexed, persistent, or session-local.

- [ ] **Step 3: Capture baseline repository state**

Run `git status --short`, `git rev-parse HEAD`, `git diff --check`, `bd show ait-dwp`, and Docker/PostgreSQL availability checks needed to interpret later gates.

### Task 2: Evaluate exact search and the deterministic symbol router

**Files:**

- Read: `scripts/find-symbol.mjs`
- Read: `scripts/lib/symbol-index.mjs`
- Read: `scripts/lib/symbol-index.test.mjs`
- Modify conditionally: the same script/test files, only if a routing defect is reproduced.

**Interfaces:**

- Consumes: corpus cases selected from current client, server, scripts, generated code, configuration, routes, and tests.
- Produces: ground-truth table for `rg`, `find:symbol`, Serena, direct LSP, and graph lookup.

- [ ] **Step 1: Select and freeze corpus cases**

Choose at least two cases in each requested category: unique symbol, duplicate symbol, UI string, configuration key, route, constant, generated symbol, test-only symbol, and client/server collision. Record expected files and counts through direct source inspection.

- [ ] **Step 2: Measure exact-search tools**

For each case capture exit code, wall time, UTF-8 bytes, observable tokens, false positives, false negatives, and follow-up calls. Use raw `rg`, `npm run find:symbol -- <name>`, Serena lookup, direct LSP where applicable, and `codebase-memory-mcp cli search_graph`.

- [ ] **Step 3: Verify router recommendations**

Run existing symbol-index tests and compare every helper recommendation with ground truth. If a defect exists, add a focused failing test, observe RED, implement the smallest deterministic rule change, and observe GREEN.

### Task 3: Evaluate TypeScript LSP and Serena semantics

**Files:**

- Create temporarily: `.tmp-tooling-audit/lsp-eval.mjs`
- Create temporarily: `.tmp-tooling-audit/serena-eval.py`
- Read: representative TypeScript source and test files selected in Task 2.

**Interfaces:**

- Consumes: LSP `initialize`, document open/readiness notifications, definitions, references, and call hierarchy; Serena MCP symbol tools.
- Produces: repeated cold/warm semantic measurements and verified callback/test/barrel behavior.

- [ ] **Step 1: Build temporary protocol harnesses**

Create isolated read-only clients that print JSON containing initialize time, query time, result locations, output bytes, and errors. They must send LSP shutdown/exit and close Serena cleanly.

- [ ] **Step 2: Establish semantic ground truth**

Test an ordinary function, method, imported function, callback, Nest dependency, test-used symbol, generated symbol, barrel export, and same-name method. Cross-check LSP results with `rg` and source inspection.

- [ ] **Step 3: Test cold start determinism**

Start a fresh process and run the same references query twice; repeat at least three fresh starts. Record project-loaded/readiness signals and use deterministic readiness when available. Recommend retry only if no usable readiness signal exists.

- [ ] **Step 4: Compare Serena**

Run `get_symbols_overview`, `find_symbol`, `find_referencing_symbols`, and `get_diagnostics_for_file` on the same cases. Record startup/schema/output costs separately from useful result size.

### Task 4: Evaluate Serena editing and CRLF safety

**Files:**

- Create temporarily: `.tmp-tooling-audit/crlf-fixture.ts`
- Create temporarily: `.tmp-tooling-audit/crlf-fixture.test.ts`

**Interfaces:**

- Consumes: controlled CRLF fixture and Serena editing tools.
- Produces: byte-level line-ending evidence for every supported editing operation.

- [ ] **Step 1: Create and validate the fixture**

Write the fixture with CRLF, record SHA-256 and counts for CRLF, bare LF, and `\r\r\n`, then confirm TypeScript parsing succeeds.

- [ ] **Step 2: Exercise editing tools independently**

Reset the fixture before each call to `replace_symbol_body`, `insert_before_symbol`, `insert_after_symbol`, `replace_content`, and `replace_in_files`. Capture the tool response and exact diff.

- [ ] **Step 3: Verify every mutation**

After each call assert zero bare LF, zero `\r\r\n`, intended diff only, and successful TypeScript parsing. Any defect becomes a confirmed failure, not an automatic workaround.

### Task 5: Evaluate codebase-memory search, graph, and freshness

**Files:**

- Create temporarily: `.tmp-tooling-audit/graph-freshness.ts`
- Read: current codebase-memory index status and cache metadata.

**Interfaces:**

- Consumes: indexed project `C-Users-admin-orca-AI_Template`.
- Produces: conceptual-search, path, whole-tree query, coverage, and freshness evidence.

- [ ] **Step 1: Measure conceptual discovery**

Run `search_graph` for retry logic, student-safe DTO filtering, and LLM completion status. Judge the first results against direct source inspection and record recall/usefulness.

- [ ] **Step 2: Measure path behavior**

Test direct calls, callbacks, multi-hop calls, paths containing `tests`, `include_tests=false`, and `include_tests=true`. Record resolution strategy and confidence.

- [ ] **Step 3: Measure whole-tree queries**

Run several bounded `query_graph` questions and compare their complexity, latency, and correctness with `rg`, LSP, and direct inspection.

- [ ] **Step 4: Measure freshness**

Create a controlled symbol, query coverage/search/path/query before and after indexing or change detection, record the update condition and delay, then remove the fixture and refresh the index. Derive an explicit freshness policy.

### Task 6: Audit RTK and hooks for silent failures

**Files:**

- Read: `template/rtk-filters.json`
- Read: `.claude/settings.json`
- Read: user-level Claude settings and hook shims.
- Create temporarily: `.tmp-tooling-audit/` failure fixtures and hook marker.
- Modify conditionally: RTK policy/config and deterministic verification scripts only for reproduced hazards.

**Interfaces:**

- Consumes: raw and wrapped commands with deliberate failures.
- Produces: exit/stdout/stderr matrix and hook lifecycle matrix.

- [ ] **Step 1: Run the RTK failure matrix**

Compare raw and wrapped behavior for `tsc`, `find`, `tree`, `playwright`, `wc`, `vitest`, `jest`, `read -l aggressive`, `lint`, `git diff`, and `rg`. Include invalid TypeScript, nonexistent paths, zero-match filters, invalid config, missing files, and syntax errors.

- [ ] **Step 2: Classify every wrapper**

Any raw failure reported as wrapped success is critical. Keep correctness commands direct and permit only wrappers whose exit and evidence semantics are preserved.

- [ ] **Step 3: Run the hook lifecycle matrix**

Use one non-destructive marker hook to test fresh, continued, resumed, and Luna-helper sessions; record user/project hook activity, order, inheritance, visible failure, and behavior after hook failure. Remove the marker immediately afterward.

- [ ] **Step 4: Verify enforcement ownership**

Map every correctness invariant to a deterministic gate. If an invariant exists only in a hook, first add a failing verification test, then implement the smallest deterministic gate coverage.

### Task 7: Audit verification hierarchy

**Files:**

- Read: `scripts/verify-*.mjs`
- Read: test files for the verification scripts.
- Create temporarily: mutation fixtures or reversible mutations selected by each gate.
- Modify conditionally: verification scripts/tests only for reproduced defects.

**Interfaces:**

- Consumes: `typecheck`, `verify:local`, `verify:template`, `verify:invariants`, `verify:paired-rules`, `verify:gates`, and `verify:diff`.
- Produces: target-failure and restored-pass evidence with truthful exit codes.

- [ ] **Step 1: Map every gate to its mechanical checks**

Read scripts and tests, record prerequisites and generated-artifact dependencies, and compare them with `AI_GUIDE.md` and `CLAUDE.md`.

- [ ] **Step 2: Run safe controlled mutations**

For each gate choose an existing tested invariant or temporary fixture, observe the expected nonzero exit, restore the exact original bytes, then observe the focused check pass.

- [ ] **Step 3: Run the unmodified hierarchy directly**

Execute all requested commands without RTK. Record full exit codes, failures, external blockers, and timings; do not claim a diagnostic command is a gate.

### Task 8: Evaluate optional candidates and apply minimal fixes

**Files:**

- Modify conditionally: `package.json`, lockfiles, diagnostic scripts/tests, agent configuration, and tooling docs.

**Interfaces:**

- Consumes: completed baseline evidence from Tasks 1-7.
- Produces: accepted/rejected candidate decisions and narrowly tested fixes.

- [ ] **Step 1: Decide whether candidate evaluation is justified**

Evaluate Knip only if unused-code diagnosis is not covered reliably. Evaluate ast-grep only if structural corpus cases expose a real gap. Do not install either without that evidence.

- [ ] **Step 2: Validate justified candidates outside gates**

Use known dead/live exports, generated Orval files, Nest-discovered code, tests, and dynamic imports for Knip; use the four requested structural patterns for ast-grep. Record false positives/negatives and cost.

- [ ] **Step 3: Implement confirmed fixes test-first**

For each repository code/config defect, add the mechanical failing check first, observe RED, apply the minimum change, observe GREEN, and record before/after evidence. Do not perform a broad tooling rewrite.

### Task 9: Publish policy and complete final verification

**Files:**

- Modify: `docs/tooling-evidence.md`
- Modify: `CLAUDE.md` and/or `AGENTS.md` only for short actionable routing that changed.
- Remove: `.tmp-tooling-audit/`

**Interfaces:**

- Consumes: all baseline and after-change measurements.
- Produces: canonical authority matrix, confidence model, final measurements, and verified repository state.

- [ ] **Step 1: Update detailed evidence**

For each tool document purpose, primary use, prohibited use, known false negatives/positives, freshness, cold start, measured latency/output, fallback, and last-tested date.

- [ ] **Step 2: Update the short entrypoint minimally**

Keep only actionable primary/fallback routing, destructive-operation cross-checks, and direct-gate requirements. Remove claims contradicted by measurements.

- [ ] **Step 3: Remove experimental state and inspect the diff**

Delete temporary fixtures, verify exact intended files, run line-ending checks and `git diff --check`, and confirm Beads status.

- [ ] **Step 4: Run final gates and corpus**

Run direct typecheck, `verify:local`, `verify:template`, `doctor:agent-tooling`, and the key corpus. Compare baseline/final task success, false negatives, silent failures, tool calls, latency, and output.

- [ ] **Step 5: Review and close**

Use the requesting-code-review skill, independently verify findings, close `ait-dwp` only when acceptance criteria are met, inspect final `git status`, and report in the eight requested sections.
