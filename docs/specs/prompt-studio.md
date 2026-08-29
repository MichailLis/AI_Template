# Prompt Studio contract

Current prompt foundation is implemented as the `analysis-prompts` bounded context under:

- Backend: `server/src/analysis-prompts/*`
- Frontend page wrapper: `client/src/pages/admin/admin-prompts-page.tsx`
- Frontend workspace: `client/src/widgets/admin-prompts-workspace/*`
- Route: `"/admin/prompts"`

Required behavior:

1. OpenRouter key is backend-only (`OPENROUTER_API_KEY` in `server/.env`).
2. Model catalog must be loaded through backend proxy (`GET /admin/prompts/models`).
3. Prompt generation must be proxied via backend (`POST /admin/prompts/generate`).
4. Frontend must never call OpenRouter directly.
5. Prefer free models by default to reduce accidental spend.
6. Prompt test variables are local UI helpers until question system is integrated.
7. For strict machine-parseable output, use `response_format: json_schema` + `strict: true` with explicit schema.
8. When schema is required, set `provider.require_parameters=true` to avoid routing to providers that ignore required params.
9. Do not enable OpenRouter web-search for tests generation (`plugins: [{id: "web"}]` and `:online` variants are out of scope).
10. Archived prompt versions remain valid for already published test versions that reference them; archive hides prompt versions from future selection/editing workflows, it must not break historical runtime analysis.

The OpenRouter environment variables are documented with the rest of the runtime configuration in
`AI_GUIDE.md`, under the Docker Runtime Contract.

---

Extracted from `AI_GUIDE.md`. The template-wide rules stay there; this file covers only the
product contract. Read it when working on `/admin/prompts`, prompt versioning, or OpenRouter calls.
