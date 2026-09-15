# AI-Agent Tooling Audit Design

**Status:** approved for implementation  
**Beads:** `ait-dwp`  
**Date:** 2026-09-14

## Goal

Bring this repository's AI-agent tooling to a minimal, predictable, measurable state. Tool selection must follow reproducible evidence rather than README claims, no correctness-bearing command may fail silently, and detailed documentation must match observed behavior after restart and resume.

## Baseline Boundary

The audit starts from commit `4cc1e05761e312cdf447e9eb61def8ec382e84b8`, the local post-PR-55 state. Before this design was supplied, the machine had already been changed: shell `rg`, RTK, Probe, Serena, TypeScript Language Server, and codebase-memory were installed; Serena and codebase-memory were registered with Codex; `mcp-ripgrep` was removed. These facts are baseline conditions, not audit conclusions. Earlier measurements are leads only and must be repeated through one fixed corpus.

No additional search, MCP, or analysis tool is installed until the baseline corpus is complete. Knip and ast-grep remain optional candidates and require an A/B result that demonstrates material value.

## Evidence Model

The audit classifies claims as:

- `DIRECT`: source text from `rg` or direct file reads, or static-semantic relationships returned by the TypeScript LSP.
- `DERIVED`: indexed or inferred results such as codebase-memory graph edges and ranked discovery.
- `BEHAVIORAL`: an observed focused test, controlled mutation, hook experiment, or tool failure reproduction.
- `VERIFIED`: required repository gates pass over the intended final state.

Search and indexing tools locate evidence; they never establish repository correctness. Negative LSP and graph results are cross-checked before rename, move, or delete. Destructive code operations require independent semantic, textual, and behavioral evidence.

## Audit Corpus

Create 15-30 deterministic tasks covering:

1. Exact search: unique and duplicate symbols, UI strings, routes, configuration keys, constants, generated code, tests, and client/server name collisions.
2. References: ordinary functions, class methods, imports, callbacks, Nest dependencies, barrel exports, overload-like same-name methods, tests, and generated files.
3. LSP readiness: repeated fresh-process queries, explicit readiness signals where available, deterministic warm-up, and retry only if readiness cannot be observed.
4. Serena: overview, lookup, references, diagnostics, and symbol-aware edits against controlled temporary copies, including CRLF preservation and TypeScript parsing.
5. Graph: conceptual discovery, direct and multi-hop calls, callbacks, paths containing `tests`, `include_tests` behavior, whole-tree queries, and freshness after a controlled temporary change.
6. RTK: deliberate failures for every listed wrapper, comparing raw and wrapped exit code, stdout, and stderr.
7. Hooks: fresh, continued, resumed, and helper-task behavior using a removable non-destructive marker.
8. Gates: focused controlled mutations proving target failures, followed by restoration and clean executions.

Each case records task success, wrong/redundant/total calls, search/read calls, observable input/output tokens, wall time, false positives, false negatives, stale data, silent failure, and verification failure. Exact token billing is not inferred where unavailable; byte-based estimates are labelled as estimates.

## Execution Phases

### Phase 1: Immutable Inventory

Read the repository and user-level sources named in the request. Record each tool's purpose, invocation, configuration source, persistence, direct-versus-derived status, failure modes, and correctness authority. Capture versions, MCP exposure, process model, hooks, and current git state.

### Phase 2: Baseline Evaluation

Run the fixed corpus without configuration changes. Establish ground truth using direct source inspection plus TypeScript LSP and focused behavior where needed. Preserve raw command, exit status, timing, and output-size evidence.

### Phase 3: Narrow Corrections

Apply only confirmed fixes in this order:

1. correctness hazards;
2. silent failures;
3. nondeterministic startup/readiness;
4. overlapping routing policy;
5. documentation drift;
6. new capabilities with demonstrated value.

Every accepted change records before evidence, the smallest change, and after evidence. Repository gates are never weakened and production code is never changed merely to simplify a benchmark.

### Phase 4: Candidate Evaluation

Evaluate Knip against a controlled dead-code corpus only after baseline. Evaluate ast-grep only for structural questions where existing tools demonstrably underperform. Analyse existing transcripts before proposing `trace:api`; prefer a deterministic CLI prototype over another MCP layer.

### Phase 5: Final Verification

Remove temporary artifacts, inspect the complete diff and line endings, run typecheck, `verify:local`, the repository release gate, the tooling doctor, and the key corpus again. Compare baseline and final task success, false negatives, silent failures, calls, latency, and output size.

## Mutation Safety

Controlled edit tests operate on temporary copies or precisely reversible fixtures. Baseline line endings are measured before each Serena edit; after each edit the audit checks for bare LF, `\r\r\n`, diff scope, parsing, and relevant typecheck. Hook markers are non-destructive and removed immediately after the matrix is complete. Graph freshness tests never rely on unverified stale state.

The audit does not push, sync, merge, or weaken gates without separate authority. Beads is the durable status system; benchmark artifacts are not left as ad hoc project memory.

## Documentation Deliverables

`docs/tooling-evidence.md` receives the detailed measurements and known boundaries for every accepted tool. The short agent entrypoint receives only actionable routing and safety rules. The final report follows the requested order: executive summary, confirmed failures, authority matrix, changes, explicitly rejected/deferred tools, baseline-versus-final results, remaining risks, and at most five next experiments.

## Success Criteria

- Critical tool claims have reproducible evidence.
- No accepted correctness-sensitive wrapper converts a raw failure into apparent success.
- Tool routing has one primary authority per intent and explicit cross-checks.
- Cold-start and freshness behavior is deterministic or explicitly guarded.
- Detailed documentation and short instructions agree with the final measurements.
- Required repository gates pass without hidden failures.
- The final corpus has no regression in task success, false negatives, silent failures, or unnecessary calls.
