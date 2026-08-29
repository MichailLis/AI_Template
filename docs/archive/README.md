# Archive

Finished work kept for provenance. Nothing here describes the current system, and nothing in
`server/`, `client/` or `scripts/` reads it.

Read it only when you need the history of a specific decision. When something here disagrees with
the code, `AI_GUIDE.md` or `template/features.manifest.json`, the archive is the one that is wrong.

## What lives here

- `superpowers/plans/` — implementation plans for features that shipped between May and July 2026.
- `superpowers/specs/` — the design documents those plans were written against.
- `prof-orientation-v3-plus/` — the original methodology source package. The runtime reads
  `server/src/tests/prof-orientation-v3-plus/site-config.json` instead, and the two have diverged.
- `technical-debt-audit-2026-05-21.md`, `security-audit-remediation.md` — point-in-time audits.
- Dated update notes from May 2026.

## Why it moved

These files were roughly 300 KB of finished work sitting next to the living documentation. Every
codebase-wide search an agent ran returned obsolete interfaces and superseded plans alongside real
answers, and the cost of that noise is paid on every task rather than once.

Live documentation stays in `docs/`: deployment guides, the UX glossary, the auth-only checklist,
and the specifications the product still follows.
