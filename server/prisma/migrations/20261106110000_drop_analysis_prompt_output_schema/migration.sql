-- outputSchema was only a copy of the schema kept in code (the LLM call reads it from code). Owner decision 2026-11-06, #90.
ALTER TABLE "analysis_prompt_versions" DROP COLUMN "outputSchema";
