# Test Flow And Prompt Workspace Update

Date: 2026-05-11

This note records the current product and maintenance state after the latest UI polish,
slider-editor, and workspace cleanup commits. It is descriptive documentation only; it does not
change repository workflow rules.

## Public Test Run

- The student run screen keeps the existing public background/theme and centers the active question
  card inside it.
- The header is reduced to progress only: current question, total question count, and percent.
- Single-choice questions advance immediately after a selected answer.
- Multi-choice, slider, and open-text questions keep explicit in-card navigation.
- Question transitions are animated so moving between questions feels less abrupt.
- Open-text answers use a higher-contrast textarea without the previous heavy shadow.
- Slider questions show the selected value with the matching label, while repeated range numbers are
  kept out of the helper copy.

## Admin Tests Editor

- Slider questions now have explicit scale fields: `min`, `max`, and `step`.
- Slider label bands remain structured rows with `min`, `max`, `label`, and `weight`.
- Slider bands are validated against the configured scale and reject invalid ranges such as
  `max <= min`.
- Additional JSON settings remain available, but core slider scale values are not hidden inside that
  JSON field.
- Large tests-editor hooks and UI pieces were split into smaller helpers/components to clear
  maintainability warnings without changing the editing workflow.

## Prompt Studio Workspace

- Prompt Studio still lives at `/admin/prompts`.
- The workspace keeps the model search/filter, prompt editor, test variables, prompt check controls,
  selected test/question preview, simulation runs, metrics, and JSON view.
- The implementation is split into smaller content, selector, state, action, and simulation-card
  modules so lint/maintainability checks stay quiet.
- OpenRouter calls remain routed through the backend admin prompt surface.

## Verification Snapshot

The latest local verification covered:

- `npm run verify:template`
- browser smoke for public test run: single choice, multi choice, slider, and open-text question
- browser smoke for `/admin/tests`, `/admin/tests/1`, and `/admin/prompts`

For local browser smoke, `manager@example.com / password123` is the practical seeded admin login.
The seed also creates `admin@admin.admin / admin`, but that short password does not satisfy the
frontend login form minimum length.
